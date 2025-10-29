/**
 * EmptyState 组件使用示例
 * 展示不同场景下的空状态样式
 */
import { EmptyState } from "@/components/ui/empty-state"
import {
  Bot,
  Sparkles,
  Brain,
  Users,
  Workflow,
  Puzzle,
  FileText,
  Link,
  Files,
  Search,
  MessageSquare,
  Mail,
  Image,
  FileQuestion,
  Settings
} from "lucide-react"

// 单智能体空状态
export function EmptyStateSingleAgent() {
  return (
    <EmptyState
      title="暂无单智能体"
      description="创建您的第一个单智能体，开启智能对话之旅"
      icons={[Bot, Sparkles, Brain]}
      action={{
        label: "创建单智能体",
        onClick: () => console.log("创建单智能体")
      }}
      variant="single-agent"
    />
  )
}

// 多智能体空状态
export function EmptyStateTeamAgent() {
  return (
    <EmptyState
      title="暂无多智能体团队"
      description="创建您的第一个多智能体团队，体验协作的力量"
      icons={[Users, Workflow, Puzzle]}
      action={{
        label: "创建多智能体",
        onClick: () => console.log("创建多智能体")
      }}
      variant="team-agent"
    />
  )
}

// 表单空状态（三个图标）
export function EmptyStateForms() {
  return (
    <EmptyState
      title="暂无表单"
      description="您可以创建一个新模板添加到您的页面中"
      icons={[FileText, Link, Files]}
      action={{
        label: "创建表单",
        onClick: () => console.log("创建表单")
      }}
    />
  )
}

// 消息空状态（两个图标）
export function EmptyStateMessages() {
  return (
    <EmptyState
      title="暂无消息"
      description="发送消息开始对话"
      icons={[MessageSquare, Mail]}
      action={{
        label: "发送消息",
        onClick: () => console.log("发送消息")
      }}
    />
  )
}

// 搜索结果空状态（无操作按钮）
export function EmptyStateSearch() {
  return (
    <EmptyState
      title="未找到结果"
      description="尝试调整您的搜索条件"
      icons={[Search, FileQuestion]}
    />
  )
}

// 图片空状态（单个图标）
export function EmptyStateMedia() {
  return (
    <EmptyState
      title="暂无图片"
      description="上传图片开始构建您的图库"
      icons={[Image]}
      action={{
        label: "上传图片",
        onClick: () => console.log("上传图片")
      }}
    />
  )
}

// 设置空状态
export function EmptyStateSettings() {
  return (
    <EmptyState
      title="暂无设置"
      description="配置您的应用设置以开始使用"
      icons={[Settings]}
      action={{
        label: "配置",
        onClick: () => console.log("配置")
      }}
    />
  )
}
