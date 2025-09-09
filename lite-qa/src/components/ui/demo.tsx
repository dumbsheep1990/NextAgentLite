import SchemaCard from "./schema-card-with-animated-wave-visualizer";

const DemoOne = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <SchemaCard 
        title="对话设置演示"
        description="这是基于SchemaCard样式创建的磨砂玻璃卡片组件示例"
        badge="Demo"
        actionText="查看"
        status="Active"
        onAction={() => console.log('Card clicked!')}
      />
    </div>
  );
};

export { DemoOne };