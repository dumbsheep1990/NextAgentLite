"""
测试元数据提取继承机制
验证政策场景是否正确继承通用场景的字段
"""
import asyncio
from service.metadata_extraction.extraction_service import metadata_extraction_service
from models.knowledge_collection import MetadataTemplate


async def test_metadata_inheritance():
    """测试政策场景是否继承通用场景字段"""

    # 模拟政策文档内容
    policy_content = """
关于进一步支持小微企业发展的若干政策措施

国务院
国发〔2023〕12号

发布日期: 2023年12月15日
生效日期: 2024年1月1日

为进一步支持小微企业发展，减轻企业税收负担，现提出以下政策措施：

一、税收优惠政策
1. 对年应纳税所得额不超过100万元的小微企业，减按12.5%计入应纳税所得额。
2. 对年应纳税所得额超过100万元但不超过300万元的部分，减按25%计入应纳税所得额。

二、社保费用减免
1. 阶段性降低养老保险费率至16%。
2. 延续实施失业保险、工伤保险阶段性降费政策。

三、融资支持措施
1. 引导金融机构加大对小微企业的信贷支持力度。
2. 完善政府性融资担保体系，降低小微企业融资成本。

本政策自2024年1月1日起施行，有效期至2026年12月31日。
    """.strip()

    filename = "国发〔2023〕12号_小微企业支持政策.txt"

    # 创建模拟的政策模版对象
    policy_template = MetadataTemplate(
        id='policy_v1',
        name='政策文档模版',
        template_type='policy',
        version='1.0',
        description='政策文档元数据模版',
        schema_definition={},
        extraction_config={
            'auto_extract': ['policy_title', 'publish_date'],
            'enable_llm_extraction': False
        },
        validation_rules={},
        display_config={},
        search_config={},
        is_system=True,
        is_active=True
    )

    print("=" * 80)
    print("开始测试元数据提取继承机制")
    print("=" * 80)
    print(f"\n文档: {filename}")
    print(f"模版类型: {policy_template.template_type}")
    print(f"\n预期结果:")
    print("  ✓ 应该包含通用字段: title, language, content_type, keywords")
    print("  ✓ 应该包含政策字段: policy_title, policy_number, issuing_authority, publish_date")
    print("\n" + "-" * 80)

    # 执行元数据提取
    result = await metadata_extraction_service.extract_metadata(
        document_id="test_doc_001",
        content=policy_content,
        filename=filename,
        template=policy_template,
        config={'enable_llm_extraction': False}
    )

    print("\n提取结果:")
    print(f"  成功: {result.success}")
    print(f"  置信度: {result.confidence_score}")
    print(f"  提取时间: {result.extraction_time:.3f}秒")
    print(f"  总字段数: {len(result.extracted_metadata)}")

    if result.errors:
        print(f"\n错误信息:")
        for error in result.errors:
            print(f"  ✗ {error}")

    if result.warnings:
        print(f"\n警告信息:")
        for warning in result.warnings:
            print(f"  ⚠ {warning}")

    print("\n" + "-" * 80)
    print("\n提取的元数据字段:")

    # 分类显示字段
    general_fields = metadata_extraction_service.extractors['general'].get_supported_fields()
    policy_fields = metadata_extraction_service.extractors['policy'].get_supported_fields()

    extracted_general = []
    extracted_policy = []

    for field, value in result.extracted_metadata.items():
        if field in general_fields:
            extracted_general.append((field, value))
        if field in policy_fields:
            extracted_policy.append((field, value))

    print(f"\n通用场景字段 ({len(extracted_general)} 个):")
    if extracted_general:
        for field, value in extracted_general:
            print(f"  ✓ {field}: {value}")
    else:
        print("  ✗ 未提取到通用字段 (这是BUG!)")

    print(f"\n政策场景字段 ({len(extracted_policy)} 个):")
    if extracted_policy:
        for field, value in extracted_policy:
            print(f"  ✓ {field}: {value}")
    else:
        print("  ⚠ 未提取到政策特定字段")

    print("\n" + "=" * 80)
    print("测试结论:")
    print("=" * 80)

    # 验证测试结果
    has_general_fields = len(extracted_general) > 0
    has_policy_fields = len(extracted_policy) > 0

    if has_general_fields and has_policy_fields:
        print("✅ 测试通过: 政策场景成功继承了通用场景字段!")
        print(f"   - 通用字段数量: {len(extracted_general)}")
        print(f"   - 政策字段数量: {len(extracted_policy)}")
        print(f"   - 总字段数量: {len(result.extracted_metadata)}")
    elif has_policy_fields and not has_general_fields:
        print("❌ 测试失败: 只有政策字段，缺少通用场景字段!")
        print("   这是之前的BUG状态，需要修复")
    elif has_general_fields and not has_policy_fields:
        print("⚠️  部分通过: 有通用字段但缺少政策字段")
        print("   可能是政策内容提取失败，但继承机制正常")
    else:
        print("❌ 测试失败: 没有提取到任何字段")

    print("\n")


if __name__ == "__main__":
    asyncio.run(test_metadata_inheritance())
