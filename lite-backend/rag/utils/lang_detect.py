from collections import defaultdict


def determine_language_by_chars(text):
    # 定义各语言的字符范围（Unicode范围）
    lang_ranges = {
        'zh': [
            (0x4E00, 0x9FFF),  # 常用汉字
            (0x3400, 0x4DBF),  # 扩展A
            (0x20000, 0x2A6DF),  # 扩展B
            (0x2A700, 0x2B73F),  # 扩展C
            (0x2B740, 0x2B81F),  # 扩展D
            (0x2B820, 0x2CEAF),  # 扩展E
            (0x2CEB0, 0x2EBEF),  # 扩展F
            (0x3000, 0x303F),  # 中文标点符号
        ],
        'en': [
            (0x0041, 0x005A),  # A-Z
            (0x0061, 0x007A),  # a-z
            (0x0020, 0x0040),  # 基本英文标点
            (0x005B, 0x0060),
            (0x007B, 0x007E),
        ],
        'ja': [
            (0x3040, 0x309F),  # 平假名
            (0x30A0, 0x30FF),  # 片假名
            (0x4E00, 0x9FFF),  # 汉字(与中文共享)
        ],
        'ko': [
            (0xAC00, 0xD7AF),  # 韩文字母
        ],
        # 可以添加其他语言范围
    }

    # 统计各语言字符出现次数
    lang_counts = defaultdict(int)
    total_chars = 0

    for char in text:
        total_chars += 1
        for lang, ranges in lang_ranges.items():
            for start, end in ranges:
                if start <= ord(char) <= end:
                    lang_counts[lang] += 1
                    break

    if not lang_counts:
        return 'zh'  # 默认中文

    # 找到占比最高的语言
    main_lang = max(lang_counts.items(), key=lambda x: x[1])[0]
    # 如果中文和日文都检测到，需要进一步区分
    if main_lang in ('zh', 'ja') and 'zh' in lang_counts and 'ja' in lang_counts:
        # 检查平假名/片假名与中文特有字符的比例
        jp_ratio = (lang_counts['ja'] - lang_counts['zh']) / total_chars
        if jp_ratio > 0.1:  # 如果日文特有字符占比超过10%
            return 'ja'
        return 'zh'

    return main_lang


def get_punctuation_for_language(lang):
    # 语言到标点符号的映射
    lang_punctuation = {
        'en': ['.', '?', '!'],  # 英语
        'zh': ['。', '？', '！'],  # 中文
        'ja': ['。', '？', '！'],  # 日语
        'ko': ['.', '?', '!'],  # 韩语
        'fr': ['.', '?', '!', '…'],  # 法语
        'es': ['.', '?', '!', '¿', '¡'],  # 西班牙语
        # 可以继续添加其他语言
    }
    return lang_punctuation.get(lang, ['.', '?', '!'])


def analyze_document_language(sections):
    text_parts = []
    for section in sections:
        if not isinstance(section.content, dict):
            text_parts.append(str(section.content).replace("-","").replace("|",""))

    all_text = " ".join(text_parts)
    if not all_text.strip():
        return "".join(['.', '?', '!'])  # 默认英语

    # 确定主语言
    main_lang = determine_language_by_chars(all_text)

    # 获取对应标点
    punctuation = get_punctuation_for_language(main_lang)

    return "".join(punctuation)
