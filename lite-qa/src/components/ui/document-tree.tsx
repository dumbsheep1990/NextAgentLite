"use client"

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import {
  Folder,
  FolderOpen,
  File as FileIcon,
  ChevronDown,
  ChevronRight,
  FileText,
  Image,
  FileVideo,
  FileAudio,
  FileCode,
  Archive,
  FileSpreadsheet,
  Download,
  Eye,
  MoreHorizontal,
  Settings,
  Plus,
  Upload,
  Trash2,
  Edit3,
  Play,
  Search,
  Copy,
  FileJson,
  Database
} from "lucide-react";

// 文档节点类型
export type DocumentNode = {
  id: string;
  name: string;
  type: "file" | "folder";
  size?: number;
  created_at?: string;
  updated_at?: string;
  status?: 'uploaded' | 'processing' | 'completed' | 'failed';
  file_type?: string;
  children?: DocumentNode[];
  collection_id?: string;
  metadata?: Record<string, any>;
};

// Props接口
interface DocumentTreeProps {
  documents: DocumentNode[];
  onSelect?: (node: DocumentNode) => void;
  onDownload?: (node: DocumentNode) => void;
  onPreview?: (node: DocumentNode) => void;
  onDelete?: (node: DocumentNode) => void;
  selectedId?: string | null;
  className?: string;
}

// 获取文件图标 - 使用public/icons文件夹中的SVG图标
function getFileIcon(fileName: string, fileType?: string) {
  const ext = fileName.toLowerCase().split('.').pop();
  const type = fileType?.toLowerCase();
  
  // 定义SVG图标映射
  const iconMap: Record<string, string> = {
    // 文档类
    'pdf': 'pdf.svg',
    'doc': 'document.svg',
    'docx': 'document.svg',
    'xls': 'csv.svg',  // 使用csv图标代替Excel
    'xlsx': 'csv.svg',
    'csv': 'csv.svg',
    'txt': 'text.svg',
    'rtf': 'document.svg',
    'md': 'markdown.svg',
    'markdown': 'markdown.svg',
    'mdx': 'mdx.svg',
    
    // 图片类
    'jpg': 'image.svg',
    'jpeg': 'image.svg',
    'png': 'image.svg',
    'gif': 'gif.svg',
    'svg': 'svg.svg',
    'webp': 'image.svg',
    'bmp': 'image.svg',
    'ico': 'image.svg',
    
    // 音视频类
    'mp3': 'audio.svg',
    'wav': 'audio.svg',
    'flac': 'audio.svg',
    'aac': 'audio.svg',
    'm4a': 'audio.svg',
    'ogg': 'audio.svg',
    'mp4': 'video.svg',
    'avi': 'video.svg',
    'mov': 'video.svg',
    'wmv': 'video.svg',
    'mkv': 'video.svg',
    'webm': 'video.svg',
    
    // 代码类
    'js': 'js.svg',
    'jsx': 'react.svg',
    'ts': 'ts.svg',
    'tsx': 'react-ts.svg',
    'json': 'tsconfig.svg',  // 使用tsconfig图标代替json
    'xml': 'xml.svg',
    'yml': 'yaml.svg',
    'yaml': 'yaml.svg',
    'html': 'code-orange.svg',
    'htm': 'code-orange.svg',
    'css': 'tailwind.svg',  // 使用tailwind图标代替css
    'scss': 'sass.svg',
    'sass': 'sass.svg',
    'less': 'code-blue.svg',
    'py': 'python.svg',
    'java': 'java.svg',
    'jar': 'java.svg',
    'c': 'c.svg',
    'h': 'h.svg',
    'cpp': 'cplus.svg',
    'cc': 'cplus.svg',
    'cxx': 'cplus.svg',
    'cs': 'csharp.svg',
    'php': 'php.svg',
    'rb': 'ruby.svg',
    'go': 'go.svg',
    'swift': 'swift.svg',
    'lua': 'lua.svg',
    'sh': 'shell.svg',
    'bash': 'shell.svg',
    'zsh': 'shell.svg',
    'fish': 'shell.svg',
    'pl': 'perl.svg',
    'r': 'r.svg',
    'rs': 'rust.svg',
    'kt': 'kotlin.svg',
    'scala': 'scala.svg',
    'clj': 'clojure.svg',
    'dart': 'dart.svg',
    'vue': 'vue.svg',
    'svelte': 'svelte.svg',
    
    // 配置文件
    'env': 'gear.svg',
    'config': 'gear.svg',
    'ini': 'gear.svg',
    'toml': 'gear.svg',
    'lock': 'lock.svg',
    'gitignore': 'ignore.svg',
    'dockerignore': 'ignore.svg',
    'editorconfig': 'editorconfig.svg',
    'eslintrc': 'eslint.svg',
    'prettierrc': 'prettier.svg',
    
    // 数据库
    'sql': 'database.svg',
    'db': 'database.svg',
    'sqlite': 'database.svg',
    
    // 字体文件
    'ttf': 'font.svg',
    'otf': 'font.svg',
    'woff': 'font.svg',
    'woff2': 'font.svg',
    'eot': 'font.svg',
    
    // 其他
    'patch': 'patch.svg',
    'diff': 'patch.svg',
    'exe': 'exe.svg',
    'ipynb': 'notebook.svg',
    'jupyter': 'notebook.svg',
    'license': 'license.svg',
    'dockerfile': 'docker.svg',
    'dockercompose': 'docker.svg',
  };
  
  // 如果有对应的SVG图标，使用它
  if (ext && iconMap[ext]) {
    return (
      <img 
        src={`/icons/files/${iconMap[ext]}`} 
        alt={ext} 
        className="w-5 h-5 object-contain"
      />
    );
  }
  
  // 特殊文件名匹配
  const fileName_lower = fileName.toLowerCase();
  if (fileName_lower === 'dockerfile') {
    return <img src="/icons/files/docker.svg" alt="docker" className="w-5 h-5 object-contain" />;
  }
  if (fileName_lower === 'makefile') {
    return <img src="/icons/files/gear.svg" alt="make" className="w-5 h-5 object-contain" />;
  }
  if (fileName_lower.includes('package.json')) {
    return <img src="/icons/files/npm.svg" alt="npm" className="w-5 h-5 object-contain" />;
  }
  if (fileName_lower.includes('tsconfig')) {
    return <img src="/icons/files/tsconfig.svg" alt="tsconfig" className="w-5 h-5 object-contain" />;
  }
  if (fileName_lower.includes('.test.') || fileName_lower.includes('.spec.')) {
    return <img src="/icons/files/vitest.svg" alt="test" className="w-5 h-5 object-contain" />;
  }
  
  // PowerPoint (没有专门图标，使用document)
  if (['ppt', 'pptx'].includes(ext || '') || type?.includes('powerpoint')) {
    return <img src="/icons/files/document.svg" alt="ppt" className="w-5 h-5 object-contain" />;
  }
  
  // 压缩文件 - 使用lock图标暂时代替
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext || '')) {
    return <img src="/icons/files/lock.svg" alt="archive" className="w-5 h-5 object-contain" />;
  }
  
  // 默认使用document图标
  return (
    <img 
      src="/icons/files/document.svg" 
      alt="file" 
      className="w-5 h-5 object-contain"
    />
  );
}

// 获取状态颜色
function getStatusColor(status?: string) {
  switch (status) {
    case 'completed': return 'text-green-600';
    case 'processing': return 'text-blue-600';
    case 'failed': return 'text-red-600';
    case 'uploaded': return 'text-gray-600';
    default: return 'text-gray-500';
  }
}

// 格式化文件大小
function formatFileSize(bytes?: number) {
  if (!bytes) return '';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

export default function DocumentTree({ 
  documents, 
  onSelect, 
  onDownload, 
  onPreview,
  onDelete,
  selectedId,
  className 
}: DocumentTreeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => {
    setExpanded((s) => ({ ...s, [id]: !s[id] }));
  };

  const handleSelect = (node: DocumentNode) => {
    onSelect?.(node);
  };

  // 递归渲染文档树
  const renderNodes = (nodes: DocumentNode[], level = 0) => {
    return nodes.map((node) => (
      <div key={node.id} className="group">
        <div
          role="treeitem"
          aria-expanded={node.type === "folder" ? !!expanded[node.id] : undefined}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors",
            selectedId === node.id ? "bg-blue-50 text-blue-900 border-l-2 border-blue-500" : "text-gray-700 hover:text-gray-900"
          )}
          style={{ paddingLeft: level * 16 + 12 }}
          onClick={() => {
            handleSelect(node);
            if (node.type === "folder") toggle(node.id);
          }}
        >
          {node.type === "folder" ? (
            <div className="flex items-center gap-1">
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(node.id);
                }}
                className="inline-block w-4 h-4 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded select-none"
              >
                {expanded[node.id] ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
              </span>
              <img 
                src={expanded[node.id] ? "/icons/folders/folder-open.svg" : "/icons/folders/folder.svg"} 
                alt="folder" 
                className="w-5 h-5 object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center gap-1 ml-5">
              {getFileIcon(node.name, node.file_type)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium truncate">{node.name}</div>
              {node.status && (
                <div 
                  className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    node.status === 'completed' ? 'bg-green-500' :
                    node.status === 'processing' ? 'bg-blue-500' :
                    node.status === 'failed' ? 'bg-red-500' :
                    'bg-gray-400'
                  )}
                />
              )}
            </div>
            {node.type === "file" && (
              <div className="text-xs text-gray-500 flex items-center gap-2">
                {node.size && <span>{formatFileSize(node.size)}</span>}
                {node.status && (
                  <span className={getStatusColor(node.status)}>
                    {node.status}
                  </span>
                )}
              </div>
            )}
          </div>

          {node.type === "file" && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="h-7 w-7 rounded-md cursor-pointer hover:bg-green-50 hover:text-green-600 flex items-center justify-center transition-colors duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload?.(node);
                    }}
                  >
                    <Download size={14} className="text-gray-500" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">下载文档</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="h-7 w-7 rounded-md cursor-pointer hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(node);
                    }}
                  >
                    <Trash2 size={14} className="text-gray-500" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">删除文档</TooltipContent>
              </Tooltip>
            </div>
          )}
          
          {/* 文件夹操作按钮 */}
          {node.type === "folder" && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="h-7 w-7 rounded-md cursor-pointer hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-colors duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: 上传到文件夹
                    }}
                  >
                    <Upload size={14} className="text-gray-500" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">上传文档</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="h-7 w-7 rounded-md cursor-pointer hover:bg-orange-50 hover:text-orange-600 flex items-center justify-center transition-colors duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: 重命名文件夹
                    }}
                  >
                    <Edit3 size={14} className="text-gray-500" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">重命名</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="h-7 w-7 rounded-md cursor-pointer hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: 删除文件夹
                    }}
                  >
                    <Trash2 size={14} className="text-gray-500" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">删除文件夹</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        {node.children && node.children.length > 0 && expanded[node.id] && (
          <div role="group">
            {renderNodes(node.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className={cn("w-full h-full", className)}>
      <TooltipProvider>
        <div className="h-full overflow-y-auto">
          {documents.length > 0 ? (
            <div role="tree" className="py-2">
              {renderNodes(documents)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Folder size={48} className="text-gray-300 mb-4" />
              <p className="text-sm text-gray-500">
                暂无文档
              </p>
            </div>
          )}
        </div>
      </TooltipProvider>
    </div>
  );
}