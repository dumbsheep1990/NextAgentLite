import os
import asyncio
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Tuple

from core.logger import logger
from service.storage_service import storage_service


@dataclass
class ODLConfig:
    jar_path: str = os.getenv(
        "ODL_JAR_PATH",
        str(Path(__file__).resolve().parent.parent / "opendataloader" / "opendataloader-pdf-cli-1.0.6.jar"),
    )
    base_output_dir: str = os.getenv(
        "ODL_BASE_OUTPUT_DIR",
        str(Path(__file__).resolve().parent.parent / "logs" / "odl"),
    )
    keep_line_breaks: bool = os.getenv("ODL_KEEP_LINE_BREAKS", "true").lower() == "true"
    markdown_with_html: bool = os.getenv("ODL_MARKDOWN_WITH_HTML", "true").lower() == "true"
    markdown_with_images: bool = os.getenv("ODL_MARKDOWN_WITH_IMAGES", "false").lower() == "true"
    content_safety_off: str = os.getenv("ODL_CONTENT_SAFETY_OFF", "").strip()
    replace_invalid_chars: str = os.getenv("ODL_REPLACE_INVALID_CHARS", " ")
    timeout_sec: int = int(os.getenv("ODL_PROCESS_TIMEOUT", "90"))


class OpenDataLoaderPDF:
    """调用 opendataloader-pdf-cli 的轻量封装，仅用于 PDF→Markdown 预处理。"""

    def __init__(self, cfg: Optional[ODLConfig] = None):
        self.cfg = cfg or ODLConfig()

    def _ensure_dirs(self, out_dir: Path) -> None:
        out_dir.mkdir(parents=True, exist_ok=True)

    async def ensure_local_pdf(self, path_or_object: str) -> Path:
        """确保获得本地可读的 PDF 文件。

        - 若 `path_or_object` 是本地路径且存在，直接返回。
        - 否则视为对象存储 object_name，从 MinIO 拉取并存到临时文件。
        """
        p = Path(path_or_object)
        if p.exists() and p.is_file():
            return p

        # 从 MinIO 下载
        bucket = storage_service.config.documents_bucket
        logger.info(f"[ODL] 从存储拉取PDF: bucket={bucket} object={path_or_object}")
        data = await storage_service.get_file(bucket, path_or_object)
        if not data:
            raise FileNotFoundError(f"无法从存储获取文件: {path_or_object}")

        import tempfile

        fd, tmp_path = tempfile.mkstemp(suffix=".pdf")
        os.close(fd)
        Path(tmp_path).write_bytes(data)
        return Path(tmp_path)

    async def convert_to_markdown(self, local_pdf: Path, out_dir: Path) -> Tuple[str, Path]:
        """执行 CLI 将 PDF 转为 Markdown，返回 (markdown_text, markdown_path)。"""
        if not Path(self.cfg.jar_path).exists():
            raise FileNotFoundError(f"ODL jar 不存在: {self.cfg.jar_path}")

        self._ensure_dirs(out_dir)

        cmd = [
            "java",
            "-jar",
            self.cfg.jar_path,
            "--markdown",
        ]
        if self.cfg.markdown_with_html:
            cmd.append("--markdown-with-html")
        if self.cfg.markdown_with_images:
            cmd.append("--markdown-with-images")
        if self.cfg.keep_line_breaks:
            cmd.append("--keep-line-breaks")
        if self.cfg.content_safety_off:
            cmd.extend(["--content-safety-off", self.cfg.content_safety_off])
        if self.cfg.replace_invalid_chars:
            cmd.extend(["--replace-invalid-chars", self.cfg.replace_invalid_chars])

        cmd.extend(["-o", str(out_dir), str(local_pdf)])

        logger.info(f"[ODL] 运行: {' '.join(cmd)}")
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=self.cfg.timeout_sec)
        except asyncio.TimeoutError:
            try:
                proc.kill()
            except Exception:
                pass
            raise TimeoutError(f"ODL 处理超时({self.cfg.timeout_sec}s): {local_pdf}")

        if proc.returncode != 0:
            logger.error(f"[ODL] 失败: code={proc.returncode}\nSTDOUT={stdout.decode(errors='ignore')}\nSTDERR={stderr.decode(errors='ignore')}")
            raise RuntimeError(f"ODL 处理失败，退出码 {proc.returncode}")

        # 推断输出的 markdown 路径
        md_path = out_dir / f"{local_pdf.stem}.md"
        if not md_path.exists():
            # 有些 PDF 名字可能包含特殊字符，尝试扫描 out_dir 下唯一的 .md
            cands = list(out_dir.glob("*.md"))
            if len(cands) == 1:
                md_path = cands[0]
            else:
                raise FileNotFoundError(f"未找到 ODL 生成的 Markdown: {md_path}")

        text = md_path.read_text(encoding="utf-8", errors="ignore")
        return text, md_path

