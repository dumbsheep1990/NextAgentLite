import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  Check,
  ChevronRight,
  Clipboard,
  Eye,
  File,
  Folder,
  FolderOpen,
} from "lucide-react"

import { cn } from "../../lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"

const treeVariants = cva(
  "group hover:before:opacity-100 before:absolute before:left-0 before:w-full before:opacity-0 before:bg-muted/80 before:h-[1.75rem] before:-z-10",
)

const treeItemVariants = cva(
  "flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-sm transition-colors duration-200 ease-in-out",
  {
    variants: {
      isSelected: {
        true: "bg-muted",
        false: "transparent",
      },
    },
    defaultVariants: {
      isSelected: false,
    },
  }
)

interface TreeDataItem {
  id: string
  name: string
  icon?: React.ReactNode
  children?: TreeDataItem[]
  actions?: React.ReactNode
  fileType?: "folder" | "file"
}

type TreeProps = React.HTMLAttributes<HTMLDivElement> & {
  data: TreeDataItem[] | TreeDataItem
  initialSlelectedItemId?: string
  onSelectChange?: (item: TreeDataItem | undefined) => void
  expandAll?: boolean
  folderIcon?: React.ReactNode
  itemIcon?: React.ReactNode
}

const Tree = React.forwardRef<HTMLDivElement, TreeProps>(
  (
    {
      data,
      initialSlelectedItemId,
      onSelectChange,
      expandAll,
      folderIcon,
      itemIcon,
      className,
      ...props
    },
    ref,
  ) => {
    const [selectedItemId, setSelectedItemId] = React.useState<string | undefined>(
      initialSlelectedItemId,
    )

    const handleSelectChange = React.useCallback(
      (item: TreeDataItem | undefined) => {
        setSelectedItemId(item?.id)
        if (onSelectChange) {
          onSelectChange(item)
        }
      },
      [onSelectChange],
    )

    const expandedItemIds = React.useMemo(() => {
      if (!initialSlelectedItemId) {
        return [] as string[]
      }

      const ids: string[] = []

      function walkTreeItems(
        items: TreeDataItem[] | TreeDataItem,
        targetId: string,
      ): boolean {
        if (items instanceof Array) {
          for (const item of items) {
            if (walkTreeItems(item, targetId)) {
              ids.push(item.id)
              return true
            }
          }
        } else if (!expandAll && items.id === targetId) {
          return true
        } else if (items.children) {
          if (walkTreeItems(items.children, targetId)) {
            ids.push(items.id)
            return true
          }
        }

        return false
      }

      walkTreeItems(data, initialSlelectedItemId)
      return ids
    }, [data, initialSlelectedItemId, expandAll])

    const [expandedItems, setExpandedItems] = React.useState<string[]>(
      expandAll ? getAllItemIds(data) : expandedItemIds,
    )

    function getAllItemIds(items: TreeDataItem[] | TreeDataItem): string[] {
      const ids: string[] = []

      if (items instanceof Array) {
        for (const item of items) {
          ids.push(item.id)
          if (item.children) {
            ids.push(...getAllItemIds(item.children))
          }
        }
      } else {
        ids.push(items.id)
        if (items.children) {
          ids.push(...getAllItemIds(items.children))
        }
      }

      return ids
    }

    const handleExpand = React.useCallback((itemId: string) => {
      setExpandedItems((prev) => {
        if (prev.includes(itemId)) {
          return prev.filter((id) => id !== itemId)
        } else {
          return [...prev, itemId]
        }
      })
    }, [])

    return (
      <div className={cn("relative p-2", className)}>
        <TreeItem
          data={data}
          ref={ref}
          selectedItemId={selectedItemId}
          handleSelectChange={handleSelectChange}
          expandedItems={expandedItems}
          FolderIcon={folderIcon}
          ItemIcon={itemIcon}
          handleExpand={handleExpand}
          {...props}
        />
      </div>
    )
  },
)

Tree.displayName = "Tree"

type TreeItemProps = TreeProps & {
  selectedItemId?: string
  handleSelectChange: (item: TreeDataItem | undefined) => void
  expandedItems: string[]
  FolderIcon?: React.ReactNode
  ItemIcon?: React.ReactNode
  handleExpand: (itemId: string) => void
}

const TreeItem = React.forwardRef<HTMLDivElement, TreeItemProps>(
  ({
    className,
    data,
    selectedItemId,
    handleSelectChange,
    expandedItems,
    FolderIcon,
    ItemIcon,
    handleExpand,
    ...props
  }) => {
    return (
      <div className={cn("relative overflow-hidden", className)} {...props}>
        {data instanceof Array ? (
          data.map((item) => (
            <TreeItem
              key={item.id}
              data={item}
              selectedItemId={selectedItemId}
              handleSelectChange={handleSelectChange}
              expandedItems={expandedItems}
              FolderIcon={FolderIcon}
              ItemIcon={ItemIcon}
              handleExpand={handleExpand}
            />
          ))
        ) : (
          <TreeNode
            item={data}
            isSelected={selectedItemId === data.id}
            isExpanded={expandedItems.includes(data.id)}
            handleSelectChange={handleSelectChange}
            handleExpand={handleExpand}
            FolderIcon={FolderIcon}
            ItemIcon={ItemIcon}
          >
            {data.children && data.children.length > 0 && (
              <TreeItem
                data={data.children}
                selectedItemId={selectedItemId}
                handleSelectChange={handleSelectChange}
                expandedItems={expandedItems}
                FolderIcon={FolderIcon}
                ItemIcon={ItemIcon}
                handleExpand={handleExpand}
                className="ml-5 rtl:mr-5 rtl:ml-0"
              />
            )}
          </TreeNode>
        )}
      </div>
    )
  },
)

TreeItem.displayName = "TreeItem"

interface TreeNodeProps {
  item: TreeDataItem
  isSelected?: boolean
  isExpanded?: boolean
  handleSelectChange: (item: TreeDataItem | undefined) => void
  handleExpand: (itemId: string) => void
  FolderIcon?: React.ReactNode
  ItemIcon?: React.ReactNode
  children?: React.ReactNode
}

const TreeNode = React.forwardRef<
  HTMLDivElement,
  TreeNodeProps & React.HTMLAttributes<HTMLDivElement>
>(
  (
    {
      item,
      isSelected,
      isExpanded,
      handleSelectChange,
      handleExpand,
      FolderIcon,
      ItemIcon,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    const handleSelect = React.useCallback(() => {
      handleSelectChange(item)
    }, [item, handleSelectChange])

    const handleExpandClick = React.useCallback(() => {
      handleExpand(item.id)
    }, [item.id, handleExpand])

    return (
      <div ref={ref} className={cn("", className)} {...props}>
        <div
          className={cn(
            treeItemVariants({ isSelected }),
            "pl-2 pr-2 before:absolute before:left-0 before:w-full before:h-[1.75rem] before:bg-muted/80 before:opacity-0 hover:before:opacity-100 before:-z-10",
            className,
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              item.children && item.children.length > 0 ? "cursor-pointer" : "",
            )}
            onClick={handleSelect}
          >
            {item.children && item.children.length > 0 ? (
              <div
                className="cursor-pointer p-1 hover:bg-accent rounded-sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleExpandClick()
                }}
              >
                <ChevronRight
                  className={cn(
                    "h-4 w-4 shrink-0 text-accent-foreground/50 transition-transform duration-200",
                    isExpanded && "rotate-90",
                  )}
                />
              </div>
            ) : (
              <div className="w-6" />
            )}
            {item.icon || (
              <>
                {item.children && item.children.length > 0 ? (
                  FolderIcon ? (
                    FolderIcon
                  ) : isExpanded ? (
                    <FolderOpen
                      className="h-4 w-4 shrink-0 text-accent-foreground/50"
                      aria-hidden="true"
                    />
                  ) : (
                    <Folder
                      className="h-4 w-4 shrink-0 text-accent-foreground/50"
                      aria-hidden="true"
                    />
                  )
                ) : ItemIcon ? (
                  ItemIcon
                ) : (
                  <File
                    className="h-4 w-4 shrink-0 text-accent-foreground/50"
                    aria-hidden="true"
                  />
                )}
              </>
            )}
            <span className="flex-grow text-sm truncate">{item.name}</span>
            {item.actions && (
              <div className="ml-auto flex items-center gap-2">
                {item.actions}
              </div>
            )}
          </div>
        </div>
        {isExpanded && children}
      </div>
    )
  },
)

TreeNode.displayName = "TreeNode"

export { Tree, type TreeDataItem }