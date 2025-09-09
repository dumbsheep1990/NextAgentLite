    async def execute_team_query_stream(
        self,
        team_name: str,
        query: str,
        session_id: str = None,
        enable_monitoring: bool = True,
        knowledge_retrieval_mode: str = 'all'
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """简化的流式Team查询方法 - 移除所有fallback逻辑"""
        
        execution_id = f"exec_{int(time.time() * 1000)}"
        start_time = time.time()
        
        logger.info(f"[TEAM] 开始流式执行Team查询: {team_name}, 执行ID: {execution_id}")
        
        # 记录执行开始
        self.active_executions[execution_id] = {
            'team_name': team_name,
            'query': query,
            'start_time': start_time,
            'status': 'running',
            'session_id': session_id
        }
        
        # 发送开始事件
        yield {
            "type": "team_start",
            "data": {
                "execution_id": execution_id,
                "team_name": team_name,
                "query": query,
                "timestamp": time.time()
            }
        }
        
        try:
            # 🔥 直接使用高级团队服务，失败就抛异常，没有fallback
            from service.advanced_agent_team_service import advanced_agent_team_service
            
            logger.info(f"[TEAM] 调用高级团队服务: {team_name}")
            
            stream_generator = await advanced_agent_team_service.advanced_team_query(
                team_name=team_name,
                query=query,
                session_id=session_id,
                stream=True,
                knowledge_retrieval_mode=knowledge_retrieval_mode
            )
            
            if stream_generator is None:
                raise Exception("高级团队服务返回None")
            
            if not hasattr(stream_generator, '__aiter__'):
                raise Exception(f"高级团队服务返回的不是异步生成器: {type(stream_generator)}")
            
            # 直接转发所有事件，不做复杂的处理
            logger.info(f"[TEAM] 开始转发高级团队服务的流式响应")
            
            async for chunk_data in stream_generator:
                event_type = chunk_data.get("type", "unknown")
                logger.debug(f"[TEAM] 转发事件: {event_type}")
                
                # 直接转发，不做任何修改
                yield chunk_data
                
                # 如果收到完成或错误事件就退出
                if event_type in ["complete", "error"]:
                    logger.info(f"[TEAM] 收到结束事件: {event_type}")
                    return
            
            logger.info(f"[TEAM] 高级团队服务流式处理完成")
            
        except Exception as error:
            logger.error(f"[TEAM] 团队查询失败: {error}")
            yield {
                "type": "error",
                "data": {
                    "error": str(error),
                    "execution_id": execution_id,
                    "timestamp": time.time()
                }
            }
        finally:
            # 清理执行记录
            if execution_id in self.active_executions:
                del self.active_executions[execution_id]