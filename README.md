# studyBackend
学习辅助项目后端
# 反向检索模块
## 提醒
- 1.接口已融合单文件 / 多文件上传 + 内容解析 + 向量入库，无需单独调用/meterial/upload解析接口，直接使用/api/resource/upload即可完成对pdf的解析操作。注意：需保证自己本地上传一次所需pdf（如test/test.pdf），检索相关的数据在lanceDB（本地文件型数据库，不会随着github上传，也不在mysql数据库）
- 2.搜索接口强制前置依赖调用语义搜索、识图搜题接口前，必须先执行上传解析接口，完成 PDF 解析与向量库入库，否则无搜索结果。
## 快速测试指南
- 项目根目录的 test/ 文件夹已提供全套测试资源：  
测试 PDF：test.pdf（数据结构资料）
测试图片：test.jpg（题目图片）
测试脚本：test.http（一键调用所有接口）
- 一键测试方法
确保项目启动，服务运行在 http://localhost:3000
用 VS Code 打开 test/test.http 文件
按接口顺序点击发送请求（Send Request）即可完成全流程测试  
