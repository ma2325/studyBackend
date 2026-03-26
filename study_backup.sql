/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- ==============================================================================
-- 1. 管理员表
-- ==============================================================================
DROP TABLE IF EXISTS `admin`;
CREATE TABLE IF NOT EXISTS `admin` (
    `id` int NOT NULL AUTO_INCREMENT,
    `admin_id` varchar(32) NOT NULL,
    `account` varchar(50) NOT NULL,
    `password` varchar(64) NOT NULL,
    `nickname` varchar(50) DEFAULT '默认管理员',
    `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
    `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `account` (`account`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='管理员表';
INSERT INTO admin (id, admin_id, account, password, nickname, create_time, update_time) VALUES (1, 'admin_sys_01', 'sysadmin', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '超级管理员', '2026-03-24 22:00:26', '2026-03-24 22:00:26');
INSERT INTO admin (id, admin_id, account, password, nickname, create_time, update_time) VALUES (2, 'admin_res_02', 'resadmin', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '资源审核员', '2026-03-24 22:00:26', '2026-03-24 22:00:26');
INSERT INTO admin (id, admin_id, account, password, nickname, create_time, update_time) VALUES (3, 'admin_user_03', 'useradmin', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '用户管理员', '2026-03-24 22:00:26', '2026-03-24 22:00:26');
-- ==============================================================================
-- 2. 音视频解析记录表
-- ==============================================================================
DROP TABLE IF EXISTS `audio_video_parse`;
CREATE TABLE IF NOT EXISTS `audio_video_parse` (
                                                   `id` int NOT NULL AUTO_INCREMENT,
                                                   `resource_id` varchar(32) NOT NULL,
    `user_id` varchar(50) NOT NULL,
    `audio_text` longtext,
    `sensitive_frames` int DEFAULT '0',
    `parse_status` tinyint DEFAULT '0',
    `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
    `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `resource_id` (`resource_id`),
    KEY `idx_user_id` (`user_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='音视频解析记录表';

-- ==============================================================================
-- 3. 费曼问答记录表
-- ==============================================================================
DROP TABLE IF EXISTS `feynman_record`;
CREATE TABLE IF NOT EXISTS `feynman_record` (
                                                `id` int NOT NULL AUTO_INCREMENT,
                                                `record_id` varchar(32) NOT NULL,
    `user_id` varchar(50) NOT NULL,
    `resource_id` varchar(32) DEFAULT NULL COMMENT '联动的专属资源ID(可为空)',
    `knowledge_point` varchar(100) NOT NULL COMMENT '考察的知识点',
    `question_text` text NOT NULL COMMENT 'AI生成的问题',
    `hints` json DEFAULT NULL COMMENT 'AI生成的提示词',
    `user_answer` text COMMENT '用户提交的答案',
    `reference_context` text COMMENT '从LanceDB或解析表抽取的标准参考文本',
    `score` int DEFAULT '0' COMMENT '综合评分(0-100)',
    `covered_points` json DEFAULT NULL COMMENT '已覆盖知识点',
    `missing_points` json DEFAULT NULL COMMENT '缺失知识点',
    `logic_flaws` json DEFAULT NULL COMMENT '逻辑断层',
    `feedback` text COMMENT '总体评价',
    `status` tinyint DEFAULT '0' COMMENT '0:待回答, 1:已评估',
    `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
    `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `record_id` (`record_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_resource_id` (`resource_id`),
    KEY `idx_knowledge_point` (`knowledge_point`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='费曼问答记录表（包含资源联动）';
-- ==============================================================================
-- 🌟 费曼问答记录表 (feynman_record) - 基于真实用户和资源联动的测试数据
-- ==============================================================================

-- 先清空旧数据，防止重复插入
DELETE FROM `feynman_record`;

INSERT INTO `feynman_record` (
    `record_id`, `user_id`, `resource_id`, `knowledge_point`,
    `question_text`, `hints`, `user_answer`, `reference_context`,
    `score`, `covered_points`, `missing_points`, `logic_flaws`, `feedback`, `status`
) VALUES
-- ------------------------------------------------------------------------------
-- 记录 1：用户 test001 (已评估) -> 关联资源：二叉树PPT.pdf (7861db0d32bf4b59a8ce4e4f04a1a7a3)
-- ------------------------------------------------------------------------------
('feyn_tree_001', 'test001', '7861db0d32bf4b59a8ce4e4f04a1a7a3', '二叉树的遍历方式',
 '如果把一棵二叉树比作一个带有分岔路口的迷宫，你会如何向一个没学过编程的人解释“前序”、“中序”和“后序”遍历的区别？',
 '["可以把节点比作藏宝箱", "思考访问左边和右边的时间点"]',
 '前序就是先开中间的箱子，再去左边，再去右边；中序是先去左边到底，然后开中间，再去右边；后序是左右都看完了，最后才开中间的箱子。',
 '参考原文：前序遍历(根左右)，中序遍历(左根右)，后序遍历(左右根)。',
 90, '["准确描述了三种遍历的节点访问顺序", "比喻形象易懂"]',
 '[]', '[]', '解释得非常生动！“开箱子”的比喻很棒，完全掌握了三种遍历的核心逻辑。', 1),

-- ------------------------------------------------------------------------------
-- 记录 2：用户 test001 (待回答) -> 关联资源：计算机网络-物理层.pdf (17e839fca2f44b43ae3cfeec55eb4559)
-- ------------------------------------------------------------------------------
('feyn_net_002', 'test001', '17e839fca2f44b43ae3cfeec55eb4559', '奈奎斯特定理与香农定理',
 '在物理层中，奈奎斯特定理和香农定理都跟传输速率有关。请用“修马路”和“堵车”的例子，分别解释这两个定理限制了什么？',
 '["奈奎斯特对应无噪声的理想条件（马路宽度）", "香农定理对应有噪声的真实条件（路况和干扰）"]',
 NULL, NULL, 0, NULL, NULL, NULL, NULL, 0),

-- ------------------------------------------------------------------------------
-- 记录 3：用户 test001 (已评估) -> 关联资源：计算机组成原理-数字表示方式.pdf (eb7a7af604054c42ac80588771881152)
-- ------------------------------------------------------------------------------
('feyn_os_003', 'test001', 'eb7a7af604054c42ac80588771881152', '补码表示法',
 '计算机为什么不直接用原码来做减法，而非要绕个弯使用“补码”？请用时钟倒拨的例子来解释这个原理。',
 '["思考减法如何转为加法", "钟表拨回2小时和拨进10小时的结果一样"]',
 '原码做减法要判断符号，太麻烦。补码就像时钟，现在是3点，我想退回1点，可以倒着拨2格，也可以顺着拨10格（3+10=13，去掉一圈12还是1）。计算机没有减法器，用补码就能把减法全变成加法算。',
 '参考原文：补码的引入是为了将减法运算转化为加法运算，简化计算机的硬件设计（只需要加法器）。',
 95, '["完美结合时钟比喻", "点出了计算机只有加法器的硬件限制"]',
 '[]', '[]', '堪称教科书级别的费曼输出！不仅说清了“是什么”，还讲透了“为什么（硬件限制）”。', 1),

-- ------------------------------------------------------------------------------
-- 记录 4：用户 test002 (已评估) -> 关联资源：操作系统作业.pdf (2a1d01d96f7547719d8c13c62b02663d)
-- ------------------------------------------------------------------------------
('feyn_os_004', 'test002', '2a1d01d96f7547719d8c13c62b02663d', '进程与线程的区别',
 '如果把操作系统比作一家大型企业，请问“进程”和“线程”分别对应企业里的什么？它们之间共享资源的方式有何不同？',
 '["进程是资源分配的最小单位", "线程是CPU调度的最小单位"]',
 '进程就像是企业里的不同部门（比如财务部、人事部），它们有自己独立的办公室和资源，不能随便乱用别人的。线程就是部门里的打工人，同一个部门的打工人（线程）共享这个部门的办公室和打印机。',
 '参考原文：进程是系统分配资源的基本单位，线程是独立运行和独立调度的基本单位，同一进程内的线程共享该进程的资源。',
 85, '["准确映射了进程和线程的层级关系", "讲清了同一进程内线程共享资源的特性"]',
 '[{"point": "切换开销", "suggestion": "可以补充说明部门切换（进程切换）的成本比打工人切换（线程切换）更高"}]',
 '[]', '部门和员工的比喻很贴切，清楚地解释了资源隔离和共享的概念。', 1),

-- ------------------------------------------------------------------------------
-- 记录 5：用户 1 (已评估) -> 关联资源：不关联文件，但基于你 notes 表里《作业一》的笔记内容生成的提问
-- ------------------------------------------------------------------------------
('feyn_ml_005', '1', NULL, '留一法交叉验证的极端情况',
 '根据你笔记中提到的留一法（Leave-one-out），在样本全是 50个正例和50个负例 时，为什么模型无论怎么预测，错误率都是100%？',
 '["考虑多数表决原则", "分析留下正例时，训练集里正负例的比例变化"]',
 '因为如果留下的测试集是正例，那训练集里正例就只剩49个，负例有50个。模型一看负例多，就会把这个测试集预测成负例，就错了。反过来留负例也是一样的，永远预测反，所以全错。',
 '参考笔记原文：留下的为正例时，训练集49正50负，预测为负，预测错误；留下的为负例时，训练集50正49负，预测为正，预测错误。',
 100, '["准确分析了训练集样本比例变化", "得出了必然预测错误的逻辑闭环"]',
 '[]', '[]', '逻辑极其严密，完全掌握了笔记中记录的极端情况悖论！', 1);
-- ==============================================================================
-- 4. 课件文本切片详情表
-- ==============================================================================
DROP TABLE IF EXISTS `material_chunk`;
CREATE TABLE IF NOT EXISTS `material_chunk` (
                                                `id` int NOT NULL AUTO_INCREMENT,
                                                `resource_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '对应 resource 表的 resource_id',
    `page_num` int NOT NULL COMMENT '该切片所在的页码',
    `content_text` longtext COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '该页提取出的纯文本内容',
    `subject` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '所属学科/科目（方便分类筛选）',
    `chunk_hash` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '文本内容的 MD5 值（用于去重）',
    `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
    `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_resource_id` (`resource_id`),
    KEY `idx_subject` (`subject`),
    KEY `idx_res_page` (`resource_id`,`page_num`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课件文本切片详情表';

-- ==============================================================================
-- 4. PII(个人敏感信息)检测记录表
-- ==============================================================================
DROP TABLE IF EXISTS `pii_record`;
CREATE TABLE IF NOT EXISTS `pii_record` (
                                            `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
                                            `resource_id` varchar(64) NOT NULL COMMENT '资源ID',
    `user_id` varchar(64) NOT NULL COMMENT '用户ID',
    `content` text NOT NULL COMMENT '检测的文本内容',
    `has_pii` tinyint NOT NULL DEFAULT '0' COMMENT '是否包含敏感信息(0:否, 1:是)',
    `pii_list` json DEFAULT NULL COMMENT '提取出的敏感信息列表',
    `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_resource_id` (`resource_id`),
    KEY `idx_user_id` (`user_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='PII敏感信息检测记录表';

DELETE FROM `feynman_record`;
INSERT INTO study_backend.pii_record (id, resource_id, user_id, content, has_pii, pii_list, create_time, update_time) VALUES (1, 'eb7a7af604054c42ac80588771881152', 'test001', '我的手机号是 13800138000，邮箱是 test@xxx.com', 1, '[{"type": "phone", "values": ["13800138000"]}, {"type": "email", "values": ["test@xxx.com"]}]', '2026-03-26 10:46:23', '2026-03-26 10:46:23');


-- ==============================================================================
-- 6. 资源表
-- ==============================================================================
DROP TABLE IF EXISTS `resource`;
CREATE TABLE IF NOT EXISTS `resource` (
                                          `id` int NOT NULL AUTO_INCREMENT,
                                          `resource_id` varchar(32) NOT NULL,
    `user_id` varchar(50) NOT NULL,
    `file_name` varchar(255) NOT NULL,
    `file_type` varchar(20) DEFAULT 'other',
    `subject` varchar(50) DEFAULT '未分类' COMMENT '所属学科/科目',
    `file_size` bigint DEFAULT '0',
    `file_hash` varchar(32) DEFAULT '',
    `privacy_level` tinyint DEFAULT '0',
    `parse_status` tinyint DEFAULT '0',
    `storage_path` varchar(500) DEFAULT '',
    `file_duration` int DEFAULT '0',
    `file_resolution` varchar(50) DEFAULT '',
    `third_party_type` varchar(20) DEFAULT NULL,
    `third_party_url` varchar(500) DEFAULT NULL,
    `third_party_status` tinyint DEFAULT '0',
    `is_delete` tinyint DEFAULT '0',
    `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
    `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `resource_id` (`resource_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_file_type` (`file_type`),
    KEY `idx_subject` (`subject`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='资源表';

INSERT INTO resource (id, resource_id, user_id, file_name, file_type, subject, file_size, file_hash, privacy_level, parse_status, storage_path, file_duration, file_resolution, third_party_type, third_party_url, third_party_status, is_delete, create_time, update_time) VALUES (6, 'a96903a16b4d4a6badae137c3fb39b64', 'test001', '程序设计网课.mp4', 'other', '未分类', 16303790, 'ee32407af439fd0d9abd06933543bfec', 0, 1, 'D:\\软创大赛\\study-Backend\\storage\\temp\\baa99bb4e1dfad12725067a4d3491913', 0, '', null, null, 0, 0, '2026-03-25 15:54:51', '2026-03-25 15:54:51');
INSERT INTO resource (id, resource_id, user_id, file_name, file_type, subject, file_size, file_hash, privacy_level, parse_status, storage_path, file_duration, file_resolution, third_party_type, third_party_url, third_party_status, is_delete, create_time, update_time) VALUES (7, '7861db0d32bf4b59a8ce4e4f04a1a7a3', 'test001', '二叉树PPT.pdf', 'pdf', '未分类', 119640, '0ff418c480bff6ea32e46ccc5089f288', 0, 1, 'D:\\软创大赛\\study-Backend\\storage\\temp\\9cd3bd6a13546ea695acfa2dca232650', 0, '', null, null, 0, 0, '2026-03-25 15:54:51', '2026-03-25 15:54:51');
INSERT INTO resource (id, resource_id, user_id, file_name, file_type, subject, file_size, file_hash, privacy_level, parse_status, storage_path, file_duration, file_resolution, third_party_type, third_party_url, third_party_status, is_delete, create_time, update_time) VALUES (8, '17e839fca2f44b43ae3cfeec55eb4559', 'test001', '计算机网络-物理层.pdf', 'pdf', '未分类', 33060442, 'ff81c8538e80f49d90fcf3ec8722d4f8', 0, 1, 'D:\\软创大赛\\study-Backend\\storage\\temp\\201784a6e5070590ea9a85871fed5c2f', 0, '', null, null, 0, 0, '2026-03-25 15:54:51', '2026-03-25 15:54:51');
INSERT INTO resource (id, resource_id, user_id, file_name, file_type, subject, file_size, file_hash, privacy_level, parse_status, storage_path, file_duration, file_resolution, third_party_type, third_party_url, third_party_status, is_delete, create_time, update_time) VALUES (9, 'b4c0d5301b7446b398d7627a37679b95', 'test001', '计算机网络应用层PPT.pptx', 'pptx', '未分类', 10073666, '13bfbc8d4ce33ef227746d34c7568fe6', 0, 1, 'D:\\软创大赛\\study-Backend\\storage\\temp\\2d302a760810f51ded2d8c7a44134dee', 0, '', null, null, 0, 0, '2026-03-25 15:54:51', '2026-03-25 15:54:51');
INSERT INTO resource (id, resource_id, user_id, file_name, file_type, subject, file_size, file_hash, privacy_level, parse_status, storage_path, file_duration, file_resolution, third_party_type, third_party_url, third_party_status, is_delete, create_time, update_time) VALUES (10, 'dd36a4ed9c3d41cf9821b516f70dc7c9', 'test001', '计算机组成原理-简单计算处理.pdf', 'pdf', '未分类', 861320, '4fdfc4f0c35b568042697068a80f7607', 0, 1, 'D:\\软创大赛\\study-Backend\\storage\\temp\\bd97bcc9dbcb90db14c7d1569da0541d', 0, '', null, null, 0, 0, '2026-03-25 15:54:51', '2026-03-25 15:54:51');
INSERT INTO resource (id, resource_id, user_id, file_name, file_type, subject, file_size, file_hash, privacy_level, parse_status, storage_path, file_duration, file_resolution, third_party_type, third_party_url, third_party_status, is_delete, create_time, update_time) VALUES (11, 'eb7a7af604054c42ac80588771881152', 'test001', '计算机组成原理-数字表示方式.pdf', 'pdf', '未分类', 939842, '00bc47f07bd7cae667c3147221a5d1db', 0, 1, 'D:\\软创大赛\\study-Backend\\storage\\temp\\4071b3ebdddc9374da793d9394b6b224', 0, '', null, null, 0, 0, '2026-03-25 15:54:51', '2026-03-25 15:54:51');
INSERT INTO resource (id, resource_id, user_id, file_name, file_type, subject, file_size, file_hash, privacy_level, parse_status, storage_path, file_duration, file_resolution, third_party_type, third_party_url, third_party_status, is_delete, create_time, update_time) VALUES (12, '0ffb34fb5a0b44e5a1b5575a1483b2d1', 'test001', '计网实验第1课.mp4', 'other', '未分类', 3129531, '65869ef3059164a8babaf2220d5350dc', 0, 1, 'D:\\软创大赛\\study-Backend\\storage\\temp\\653f22c7ed68135a31f8bd125edb1e45', 0, '', null, null, 0, 0, '2026-03-25 15:54:51', '2026-03-25 15:54:51');
INSERT INTO resource (id, resource_id, user_id, file_name, file_type, subject, file_size, file_hash, privacy_level, parse_status, storage_path, file_duration, file_resolution, third_party_type, third_party_url, third_party_status, is_delete, create_time, update_time) VALUES (14, '2a1d01d96f7547719d8c13c62b02663d', 'test002', '操作系统作业.pdf', 'pdf', '未分类', 1238703, '10c170bf92e9abb97a1076323708f3a5', 0, 1, 'D:\\软创大赛\\study-Backend\\storage\\temp\\eef560b7dfde961e2e878a8ea3b7c773', 0, '', null, null, 0, 0, '2026-03-25 15:59:14', '2026-03-25 15:59:14');
INSERT INTO resource (id, resource_id, user_id, file_name, file_type, subject, file_size, file_hash, privacy_level, parse_status, storage_path, file_duration, file_resolution, third_party_type, third_party_url, third_party_status, is_delete, create_time, update_time) VALUES (15, 'dfdbb01c5aa4450ea6510fa863fcb424', 'test001', '理论力学笔记.pdf', 'pdf', '未分类', 21761396, '929f1a51e3b01070723d97c3f0aaae66', 0, 1, 'D:\\软创大赛\\study-Backend\\storage\\temp\\dda2b36e6a067b04ea58af4866df7d9c', 0, '', null, null, 0, 0, '2026-03-26 09:34:52', '2026-03-26 09:34:52');


-- ==============================================================================
-- 7. 第三方文件记录表
-- ==============================================================================
DROP TABLE IF EXISTS `third_party_file`;
CREATE TABLE IF NOT EXISTS `third_party_file` (
                                                  `id` int NOT NULL AUTO_INCREMENT,
                                                  `resource_id` varchar(32) NOT NULL,
    `user_id` varchar(50) NOT NULL,
    `third_type` varchar(20) NOT NULL,
    `origin_url` varchar(500) NOT NULL,
    `local_path` varchar(500) DEFAULT '',
    `download_status` tinyint DEFAULT '0',
    `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_resource_id` (`resource_id`),
    KEY `idx_user_id` (`user_id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='第三方文件记录表';








DROP TABLE IF EXISTS `notes`;
-- 导出  表 study_backend.notes 结构
CREATE TABLE `notes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `note_id` varchar(32) NOT NULL COMMENT '业务唯一ID',
  `user_id` varchar(50) NOT NULL COMMENT '关联admin表的account',
  `file_name` varchar(255) DEFAULT NULL,
  `content` longtext,
  `status` tinyint DEFAULT '0' COMMENT '0:处理中, 1:成功, 2:失败',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `note_id` (`note_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DELETE FROM `notes`;

INSERT INTO study_backend.notes (id, note_id, user_id, file_name, content, status, create_time, update_time) VALUES (2, '9ef4887a9b8f46d384bed2924b506d74', '1', '�\\���.pdf', '作业一
1.模型预测:哪个多预测成哪个,一样多随机预测
留一法:留一个作测试集,其余为训练集
两种情况:
①留下的为正例:训练集99个样本,49正例50负例
预测结果为负例(50>4P)
预测错误,并且发生50次(50个正例轮流被留下)
②留下的为负例:训练样本99个,49负例50正例
预测结果为正例(50>49)
预测错误.发生50次
错误率:错误新测数50+50=1=100%
2.设回归方程:y=wx+b
x为温度,y为得率,n=10
x==100+110+120++190=145
==40+44+50++83=60.5
(xi-x)(yi-)
利用最小=乘法w=(xi-x)2
分子=3900分母=8250
代入原式W=≈0.4727
b=y-wx=60.5-0.4727x145=-8.0415
y=0.4727x-8.0415', 1, '2026-03-26 10:10:14', '2026-03-26 10:10:16');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;