// 临时文件，删除AntLayout部分，保留顶部栏独立结构
        {/* 内容区域 */}
        <div style={{
          flex: 1,
          margin: 0,
          padding: 0,
          background: '#f8fafc',
          minHeight: 'calc(100vh - 56px)',
          overflow: 'auto'
        }}>
          <Outlet />
        </div>
      </div>

      {/* SSE连接状态指示器 */}