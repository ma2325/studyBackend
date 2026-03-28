-- --------------------------------------------------------
-- 主机:                           127.0.0.1
-- 服务器版本:                        9.2.0 - MySQL Community Server - GPL
-- 服务器操作系统:                      Win64
-- HeidiSQL 版本:                  12.11.0.7065
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- 导出  表 study_backend.admin 结构
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='管理员表';

-- 正在导出表  study_backend.admin 的数据：~3 rows (大约)
DELETE FROM `admin`;
INSERT INTO `admin` (`id`, `admin_id`, `account`, `password`, `nickname`, `create_time`, `update_time`) VALUES
	(1, 'admin_sys_01', 'sysadmin', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '超级管理员', '2026-03-24 22:00:26', '2026-03-24 22:00:26'),
	(2, 'admin_res_02', 'resadmin', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '资源审核员', '2026-03-24 22:00:26', '2026-03-24 22:00:26'),
	(3, 'admin_user_03', 'useradmin', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '用户管理员', '2026-03-24 22:00:26', '2026-03-24 22:00:26');

-- 导出  表 study_backend.audio_video_parse 结构
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

-- 正在导出表  study_backend.audio_video_parse 的数据：~0 rows (大约)
DELETE FROM `audio_video_parse`;

-- 导出  表 study_backend.feynman_record 结构
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='费曼问答记录表（包含资源联动）';

-- 正在导出表  study_backend.feynman_record 的数据：~1 rows (大约)
DELETE FROM `feynman_record`;

INSERT INTO study_backend.feynman_record (id, record_id, user_id, resource_id, knowledge_point, question_text, hints, user_answer, reference_context, score, covered_points, missing_points, logic_flaws, feedback, status, create_time, update_time) VALUES (6, 'b47086c4917b4e5cb0cf9f1e27e76ccd', 'test001', '7861db0d32bf4b59a8ce4e4f04a1a7a3', '完全二叉树', '请根据完全二叉树的定义，判断以下给出的二叉树是否为完全二叉树，并说明理由。', '["回忆完全二叉树的定义：除了最后一层外，其他各层的结点都达到最大，且最后一层的结点都连续地排在左边。", "分析给定二叉树的最后一层节点是否连续靠左，并检查其他层是否已满。"]', null, null, 0, null, null, null, null, 0, '2026-03-28 18:47:13', '2026-03-28 18:47:13');
INSERT INTO study_backend.feynman_record (id, record_id, user_id, resource_id, knowledge_point, question_text, hints, user_answer, reference_context, score, covered_points, missing_points, logic_flaws, feedback, status, create_time, update_time) VALUES (7, 'd1d20ac75dc4466281b97a5ac89b8adb', 'test001', '7861db0d32bf4b59a8ce4e4f04a1a7a3', '完全二叉树', '请详细描述完全二叉树的定义，并说明其在数据结构中的重要特性。在完全二叉树中，若一个节点的索引为i（从1开始计数），那么其左孩子和右孩子分别位于什么位置？', '["完全二叉树除了最后一层外，其他层的节点数都达到了最大值。", "完全二叉树的特点是其节点存储在数组中，便于高效的访问和操作。", "左孩子的索引为2i，右孩子的索引为2i+1。"]', '完全二叉树就是一棵树，它最底层少了一些节点，而且满二叉树肯定是完全二叉树。', '未匹配到特定参考资料', 75, '["已覆盖的知识点1"]', '[{"point": "完全二叉树的定义错误", "suggestion": "完全二叉树的定义不完全正确，建议补充完全二叉树的严格定义"}, {"point": "关于节点索引i的位置的正确性", "suggestion": "未涉及节点索引i对应的左孩子和右孩子的正确位置，建议补充这部分内容"}]', '[{"flaw": "关于满二叉树和完全二叉树的关系描述错误", "suggestion": "应明确说明满二叉树是完全二叉树的特例"}]', '回答基本涵盖了完全二叉树的一些概念，但定义和部分特性不准确，补充定义和重要特性会更好。', 1, '2026-03-28 18:47:13', '2026-03-28 18:52:29');
INSERT INTO study_backend.feynman_record (id, record_id, user_id, resource_id, knowledge_point, question_text, hints, user_answer, reference_context, score, covered_points, missing_points, logic_flaws, feedback, status, create_time, update_time) VALUES (8, 'c79ccd1cfee644e49f53f1d1672e22d4', 'test001', '7861db0d32bf4b59a8ce4e4f04a1a7a3', '完全二叉树的特点与定义', '根据PPT中的内容，完全二叉树的特点有哪些？特别是关于叶子节点和各层节点数量的描述。', '["完全二叉树是指除了最后一层外，其他各层的节点数都达到了最大值。", "叶子节点都集中在最后一层，并且是连续的."]', '完全二叉树就是在满二叉树的基础上，去掉几个底层的节点得到的。它的特点是，所有的叶子节点都必须在最下面那一层。', '未匹配到特定参考资料', 75, '["叶子节点必须在最下面一层"]', '[{"point": "其他层的节点都在最左边", "suggestion": "补充缺少的内容"}, {"point": "逻辑连接词", "suggestion": "补充逻辑连接词"}]', '[{"flaw": "逻辑断层：解释完全二叉树的定义时缺少必要的逻辑连接词如“进而”或“因此”，段落之间衔接松散", "suggestion": "补充逻辑连接词"}]', '回答基本正确但定义不够完整，缺少一些关键点', 1, '2026-03-28 19:08:04', '2026-03-28 19:12:41');
INSERT INTO study_backend.feynman_record (id, record_id, user_id, resource_id, knowledge_point, question_text, hints, user_answer, reference_context, score, covered_points, missing_points, logic_flaws, feedback, status, create_time, update_time) VALUES (9, 'd4d6d63fe6b84b8097bf483b9d228499', 'test001', '76dac65b0cae469b8a573ed11ed30e8f', '完全二叉树的特点与定义', '请判断以下哪些结构是完全二叉树？（多选题）', '["完全二叉树的特点是什么？", "回忆完全二叉树的定义，观察左右子树的节点数目关系"]', null, null, 0, null, null, null, null, 0, '2026-03-28 19:14:33', '2026-03-28 19:14:33');
INSERT INTO study_backend.feynman_record (id, record_id, user_id, resource_id, knowledge_point, question_text, hints, user_answer, reference_context, score, covered_points, missing_points, logic_flaws, feedback, status, create_time, update_time) VALUES (10, 'f7db638d38e9472ba4da703f561c5a6a', 'test001', '76dac65b0cae469b8a573ed11ed30e8f', '完全二叉树的特点与定义', '假设完全二叉树的高度为h，则其最多可以有多少个节点？然后，如果一个完全二叉树的最后一层有k个节点，那么它的最后一个非满节点是在哪个位置？', '["完全二叉树的高度指的是从根节点到最远的叶子节点的最长层数加一", "完全二叉树的结构决定了最后一层的非满节点和非叶子节点的位置", "高度h的完全二叉树最多可以有2^h - 1个节点", "可以通过计算2^(h-1) + k -1来得到最后一个非满节点的位置", "举一个具体的例子，当h=3时，计算最大节点数和非满节点数", "利用二叉树的层次结构和完全二叉树的定义来推导答案"]', null, null, 0, null, null, null, null, 0, '2026-03-28 19:14:37', '2026-03-28 19:14:37');
INSERT INTO study_backend.feynman_record (id, record_id, user_id, resource_id, knowledge_point, question_text, hints, user_answer, reference_context, score, covered_points, missing_points, logic_flaws, feedback, status, create_time, update_time) VALUES (11, 'ab30bd1cd7dc4dabb8aeedc149972a6b', 'test001', 'c79ccd1cfee644e49f53f1d1672e22d4', '完全二叉树的特点与定义', '请描述完全二叉树的特点，并说明如何使用这些特点来判断一个给定的二叉树是否为完全二叉树。', '["完全二叉树是一个所有层，除了最后一层外，都是满的，并且最后一层的节点都集中在该层的左边。", "要判断一个二叉树是否为完全二叉树，可以按照完全二叉树的定义来检查，通常可以将二叉树按层次顺序存储，并根据节点的位置关系来确定其是否为完全二叉树。"]', null, null, 0, null, null, null, null, 0, '2026-03-28 19:15:41', '2026-03-28 19:15:41');
INSERT INTO study_backend.feynman_record (id, record_id, user_id, resource_id, knowledge_point, question_text, hints, user_answer, reference_context, score, covered_points, missing_points, logic_flaws, feedback, status, create_time, update_time) VALUES (12, '3dd676a6752343aa9acfc49fdc93ca7f', 'test001', '76dac65b0cae469b8a573ed11ed30e8f', '完全二叉树的特点与定义', '根据test.pdf中的知识，描述完全二叉树的定义，并指出其结构特点。在不同层级及其节点数排列方面有哪些具体要求？', '["回忆完全二叉树的定义，所有层次，除了最后一层外，前面的层次都填满，且最后一层的所有节点都尽可能排列在左边", "考虑如何将这些知识点与具体结构或示例相关联"]', '完全二叉树就是一棵满二叉树在最底层从左到右去掉几个节点得到的树。它的结构特点是除了最后一层其他层都是满的，而且所有的叶子节点都必须长在最下面那一层。', '[摘自《test.pdf》 第 4 页]：
2) Break----------------
4Boyu.AI
二叉树的定义
完全二叉树
在满二叉树的最底层自右至左依次     (注意：不能跳过
任何一个结点  )去掉若干个结点得到的二叉树也被称
之为完全二叉树  。 满二叉树一定是完全二叉树    ， 但
完全二叉树不一定是满二叉树    。
特点：
 （1）所有的叶结点都出现在最低的两层上     。
 （ 2）对任一结点，如果其右子树的高度为     k，
则其左子树的高度为   k或 k＋ 1。
D
C
GE              F
B
A
K                             OL              NM
D
C
GE            F
B
A
H     I      J
完全二叉树
不是完全二叉树

[摘自《test.pdf》 第 4 页]：
2) Break----------------
4Boyu.AI
二叉树的定义
完全二叉树
在满二叉树的最底层自右至左依次     (注意：不能跳过
任何一个结点  )去掉若干个结点得到的二叉树也被称
之为完全二叉树  。 满二叉树一定是完全二叉树    ， 但
完全二叉树不一定是满二叉树    。
特点：
 （1）所有的叶结点都出现在最低的两层上     。
 （ 2）对任一结点，如果其右子树的高度为     k，
则其左子树的高度为   k或 k＋ 1。
D
C
GE              F
B
A
K                             OL              NM
D
C
GE            F
B
A
H     I      J
完全二叉树
不是完全二叉树

[摘自《test.pdf》 第 4 页]：
2) Break----------------
4Boyu.AI
二叉树的定义
完全二叉树
在满二叉树的最底层自右至左依次     (注意：不能跳过
任何一个结点  )去掉若干个结点得到的二叉树也被称
之为完全二叉树  。 满二叉树一定是完全二叉树    ， 但
完全二叉树不一定是满二叉树    。
特点：
 （1）所有的叶结点都出现在最低的两层上     。
 （ 2）对任一结点，如果其右子树的高度为     k，
则其左子树的高度为   k或 k＋ 1。
D
C
GE              F
B
A
K                             OL              NM
D
C
GE            F
B
A
H     I      J
完全二叉树
不是完全二叉树', 75, '["完全二叉树的定义", "结构特点"]', '[]', '[]', '据资料，完全二叉树的结构特点是除了最后一层其他层都是满的，且所有的叶结点都必须长在最下一层。(参考课件第4页)', 1, '2026-03-28 19:19:21', '2026-03-28 19:24:48');


-- 导出  表 study_backend.material_chunk 结构
DROP TABLE IF EXISTS `material_chunk`;
CREATE TABLE IF NOT EXISTS `material_chunk` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resource_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `page_num` int NOT NULL COMMENT '该切片所在的页码',
  `content_text` mediumtext COLLATE utf8mb4_unicode_ci,
  `subject` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chunk_hash` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_resource_id` (`resource_id`),
  KEY `idx_subject` (`subject`),
  KEY `idx_res_page` (`resource_id`,`page_num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课件文本切片详情表';

-- 正在导出表  study_backend.material_chunk 的数据：~24 rows (大约)
DELETE FROM `material_chunk`;
INSERT INTO `material_chunk` (`id`, `resource_id`, `page_num`, `content_text`, `subject`, `chunk_hash`, `create_time`, `update_time`) VALUES
	(1b4c49832b2444a69e46aa3638684969, '99e80dd5c3dc41e180630df4abc81a0b', 6, '4) Break----------------\r\n6Boyu.AI\r\n二叉树的定义\r\n二叉树的操作\r\n⚫ 建树 create()：创建一棵空的二叉树\r\n⚫ 清空 clear()：删除二叉树中的所有结点\r\n⚫ 判空 IsEmpty()：判别二叉树是否为空树\r\n⚫ 求树的规模  size()：统计树上的结点数\r\n⚫ 找根结点 root()：找出二叉树的根结点值；如果树是空树，则返回一个特殊值\r\n⚫ 找父结点 parent(x)：找出结点  x的父结点值；如果  x不存在或 x是根，则返回一个特殊值\r\n⚫ 找左孩子 lchild(x)：找结点 x的左孩子结点值；如果   x不存在或 x的左儿子不存在，则返回\r\n一个特殊值\r\n⚫ 找右孩子 rchild(x)：找结点 x的右孩子结点值；如果   x不存在或 x的右儿子不存在，则返回\r\n一个特殊值\r\n⚫ 删除左子树  delLeft(x)：删除结点  x的左子树\r\n⚫ 删除右子树  delRight(x)：删除结点  x的右子树\r\n⚫ 前序 遍历 preOrder()： 前序遍历 二叉树上的每一个结点\r\n⚫ 中序 遍历 midOrder()： 中序遍历 二叉树上的每一个结点\r\n⚫ 后序 遍历 postOrder()： 后序遍历 二叉树上的每一个结点\r\n⚫ 层次遍历 levelOrder()：层次遍历二叉树上的每个结点', '未分类', '34059212bfb8d5bbd105f82656ad67da', '2026-03-26 15:36:56', '2026-03-26 15:36:56'),
	(1d773695a34a435997c7777f339ae5a3, '99e80dd5c3dc41e180630df4abc81a0b', 1, '1Boyu.AI\r\n二叉树的定义\r\n二叉树的定义\r\n二叉树（ Binary Tree）是结点的有限集合，它或者\r\n为空，或者由一个根结点及两棵互不相交的左、右\r\n子树构成，而其左、右子树又都是二叉树。\r\n注意：二叉树必须严格区分左右子树。即使只有一\r\n棵子树，也要说明它是左子树还是右子树。交换一\r\n棵二叉树的左右子树后得到的是另一棵二叉树。\r\n左\r\n子\r\n树\r\n右\r\n子\r\n树\r\n空二叉树\r\n只有根结点\r\n的二叉树\r\n左\r\n子\r\n树\r\n右\r\n子\r\n树', '未分类', 'f80d84ab81f473cc1d49191830862ebd', '2026-03-26 15:36:56', '2026-03-26 15:36:56'),
	(211a54d19dc14fec893f3a6ba0003cae, '76dac65b0cae469b8a573ed11ed30e8f', 4, '2) Break----------------\r\n4Boyu.AI\r\n二叉树的定义\r\n完全二叉树\r\n在满二叉树的最底层自右至左依次     (注意：不能跳过\r\n任何一个结点  )去掉若干个结点得到的二叉树也被称\r\n之为完全二叉树  。 满二叉树一定是完全二叉树    ， 但\r\n完全二叉树不一定是满二叉树    。\r\n特点：\r\n （1）所有的叶结点都出现在最低的两层上     。\r\n （ 2）对任一结点，如果其右子树的高度为     k，\r\n则其左子树的高度为   k或 k＋ 1。  \r\nD\r\nC\r\nGE              F\r\nB\r\nA\r\nK                             OL              NM\r\nD\r\nC\r\nGE            F\r\nB\r\nA\r\nH     I      J\r\n完全二叉树\r\n不是完全二叉树', '未分类', 'fdcfc07bc912ba70875cac248bae51c7', '2026-03-26 15:36:56', '2026-03-26 15:36:56'),
	(225d7eba3a2d4e91b79d47726ca5a273, '2711adad139649fba22548ab9c4ef311', 3, '1) Break----------------\r\n3Boyu.AI\r\n二叉树的定义\r\n满二叉树\r\n一棵高度为  k并具有 2k－ 1个结点的二叉树称为满二叉树\r\n除最底层，任意一层的结点个数都达到了最大值\r\nD\r\nC\r\nGEF\r\nB\r\nA\r\nHKIJOLNM\r\n满二叉树实例\r\nD\r\nC\r\nGEF\r\nB\r\nA\r\nHIJ\r\n不是满二叉树', '未分类', '52511395c3b9fba1aef7a6e1cecc1e19', '2026-03-26 15:25:03', '2026-03-26 15:25:03'),
	(39740ae260c04bb09a24c6a45ba9730f, '2711adad139649fba22548ab9c4ef311', 1, '1Boyu.AI\r\n二叉树的定义\r\n二叉树的定义\r\n二叉树（ Binary Tree）是结点的有限集合，它或者\r\n为空，或者由一个根结点及两棵互不相交的左、右\r\n子树构成，而其左、右子树又都是二叉树。\r\n注意：二叉树必须严格区分左右子树。即使只有一\r\n棵子树，也要说明它是左子树还是右子树。交换一\r\n棵二叉树的左右子树后得到的是另一棵二叉树。\r\n左\r\n子\r\n树\r\n右\r\n子\r\n树\r\n空二叉树\r\n只有根结点\r\n的二叉树\r\n左\r\n子\r\n树\r\n右\r\n子\r\n树', '未分类', 'f80d84ab81f473cc1d49191830862ebd', '2026-03-26 15:25:03', '2026-03-26 15:25:03'),
	(3a418e293e41474dbfa27ccf0e3fd912, '2711adad139649fba22548ab9c4ef311', 5, '3) Break----------------\r\n5Boyu.AI\r\n二叉树的定义\r\n二叉树的操作\r\n⚫  建树 create()：创建一棵空树\r\n⚫  清空 clear()：删除树中的所有结点\r\n⚫  判空 IsEmpty()：判别是否为空树\r\n⚫  求树的规模  size()：统计树上的结点数\r\n⚫  找根结点 root()：找出树的根结点值；如果树是空树，则返回一个特殊值\r\n⚫  找父结点 parent(x)：找出结点  x的父结点值；如果  x不存在或 x是根结点，则返回一个特殊值\r\n⚫  找子结点 child(x,i)：找结点 x的第 i个子结点值  ; 如果 x不存在或 x的第 i个儿子不存在，则返回一\r\n个特殊值\r\n⚫  剪枝 remove(x,i)：删除结点  x的第 i棵子树\r\n⚫  遍历 traverse()：访问树上的每一个结点\r\n⚫ lchild(x),  rchild(x)\r\n⚫ delLeft(x),  delRight(x)', '未分类', 'f6cc4ec39a8ee926b3130eead090cc7c', '2026-03-26 15:25:03', '2026-03-26 15:25:03'),
	(4234e650dd8a4aa7913de6f792ae3d57, '76dac65b0cae469b8a573ed11ed30e8f', 8, '6) Break----------------', '未分类', '62ed33f848a26407c918246dfaafb831', '2026-03-26 15:36:56', '2026-03-26 15:36:56'),
	(436fe2241d084102a10cd4bcef22830d, '76dac65b0cae469b8a573ed11ed30e8f', 2, '0) Break----------------\r\n2Boyu.AI\r\n二叉树的定义\r\n二叉树实例\r\n3个结点组成的树\r\n3个结点组成的二叉树', '未分类', 'a9dfdf37ed33dc477fa8095f5febc606', '2026-03-26 15:36:56', '2026-03-26 15:36:56'),
	(460a4ec8a84c4a45a8d55e32e6457db5, '76dac65b0cae469b8a573ed11ed30e8f', 1, '1Boyu.AI\r\n二叉树的定义\r\n二叉树的定义\r\n二叉树（ Binary Tree）是结点的有限集合，它或者\r\n为空，或者由一个根结点及两棵互不相交的左、右\r\n子树构成，而其左、右子树又都是二叉树。\r\n注意：二叉树必须严格区分左右子树。即使只有一\r\n棵子树，也要说明它是左子树还是右子树。交换一\r\n棵二叉树的左右子树后得到的是另一棵二叉树。\r\n左\r\n子\r\n树\r\n右\r\n子\r\n树\r\n空二叉树\r\n只有根结点\r\n的二叉树\r\n左\r\n子\r\n树\r\n右\r\n子\r\n树', '未分类', 'f80d84ab81f473cc1d49191830862ebd', '2026-03-26 15:36:56', '2026-03-26 15:36:56'),
	(49919f1870c4408e9d57e23db5c42f3a, '2711adad139649fba22548ab9c4ef311', 7, '5) Break----------------\r\n7Boyu.AI\r\n二叉树的定义\r\n二叉树抽象类\r\ntemplate<class T>\r\nclass bTree {\r\npublic:\r\nvirtual void clear() = 0;\r\nvirtual bool isEmpty() const = 0;\r\nvirtual int size() const = 0;\r\nvirtual T Root(T flag) const = 0;\r\nvirtual T parent(T x， T flag) const = 0; \r\nvirtual T lchild（ T x, T flag) const = 0;\r\nvirtual T rchild（ T x, T flag) const = 0;\r\nvirtual void delLeft(T x) = 0;\r\nvirtual void delRight(T x) = 0;\r\nvirtual void preOrder() const = 0;\r\nvirtual void midOrder() const = 0;\r\nvirtual void postOrder() const= 0;\r\nvirtual void levelOrder() const = 0;\r\nvirtual bTree() {}\r\n};', '未分类', '0a3aa723b7eebdd973dde0065dab7be4', '2026-03-26 15:25:03', '2026-03-26 15:25:03'),
	(4d5c9a53f4d647749d1d9418e27274b2, '2711adad139649fba22548ab9c4ef311', 2, '0) Break----------------\r\n2Boyu.AI\r\n二叉树的定义\r\n二叉树实例\r\n3个结点组成的树\r\n3个结点组成的二叉树', '未分类', 'a9dfdf37ed33dc477fa8095f5febc606', '2026-03-26 15:25:03', '2026-03-26 15:25:03'),
	(54eed698d191408bae7e36bd79643def, '76dac65b0cae469b8a573ed11ed30e8f', 7, '5) Break----------------\r\n7Boyu.AI\r\n二叉树的定义\r\n二叉树抽象类\r\ntemplate<class T>\r\nclass bTree {\r\npublic:\r\nvirtual void clear() = 0;\r\nvirtual bool isEmpty() const = 0;\r\nvirtual int size() const = 0;\r\nvirtual T Root(T flag) const = 0;\r\nvirtual T parent(T x， T flag) const = 0; \r\nvirtual T lchild（ T x, T flag) const = 0;\r\nvirtual T rchild（ T x, T flag) const = 0;\r\nvirtual void delLeft(T x) = 0;\r\nvirtual void delRight(T x) = 0;\r\nvirtual void preOrder() const = 0;\r\nvirtual void midOrder() const = 0;\r\nvirtual void postOrder() const= 0;\r\nvirtual void levelOrder() const = 0;\r\nvirtual bTree() {}\r\n};', '未分类', '0a3aa723b7eebdd973dde0065dab7be4', '2026-03-26 15:36:56', '2026-03-26 15:36:56'),
	(640bb703f9f34a9982ccd53a1bf09488, '99e80dd5c3dc41e180630df4abc81a0b', 7, '5) Break----------------\r\n7Boyu.AI\r\n二叉树的定义\r\n二叉树抽象类\r\ntemplate<class T>\r\nclass bTree {\r\npublic:\r\nvirtual void clear() = 0;\r\nvirtual bool isEmpty() const = 0;\r\nvirtual int size() const = 0;\r\nvirtual T Root(T flag) const = 0;\r\nvirtual T parent(T x， T flag) const = 0; \r\nvirtual T lchild（ T x, T flag) const = 0;\r\nvirtual T rchild（ T x, T flag) const = 0;\r\nvirtual void delLeft(T x) = 0;\r\nvirtual void delRight(T x) = 0;\r\nvirtual void preOrder() const = 0;\r\nvirtual void midOrder() const = 0;\r\nvirtual void postOrder() const= 0;\r\nvirtual void levelOrder() const = 0;\r\nvirtual bTree() {}\r\n};', '未分类', '0a3aa723b7eebdd973dde0065dab7be4', '2026-03-26 15:36:56', '2026-03-26 15:36:56'),
	(6a9426b4409144379c3977d84ab09def, '2711adad139649fba22548ab9c4ef311', 6, '4) Break----------------\r\n6Boyu.AI\r\n二叉树的定义\r\n二叉树的操作\r\n⚫ 建树 create()：创建一棵空的二叉树\r\n⚫ 清空 clear()：删除二叉树中的所有结点\r\n⚫ 判空 IsEmpty()：判别二叉树是否为空树\r\n⚫ 求树的规模  size()：统计树上的结点数\r\n⚫ 找根结点 root()：找出二叉树的根结点值；如果树是空树，则返回一个特殊值\r\n⚫ 找父结点 parent(x)：找出结点  x的父结点值；如果  x不存在或 x是根，则返回一个特殊值\r\n⚫ 找左孩子 lchild(x)：找结点 x的左孩子结点值；如果   x不存在或 x的左儿子不存在，则返回\r\n一个特殊值\r\n⚫ 找右孩子 rchild(x)：找结点 x的右孩子结点值；如果   x不存在或 x的右儿子不存在，则返回\r\n一个特殊值\r\n⚫ 删除左子树  delLeft(x)：删除结点  x的左子树\r\n⚫ 删除右子树  delRight(x)：删除结点  x的右子树\r\n⚫ 前序 遍历 preOrder()： 前序遍历 二叉树上的每一个结点\r\n⚫ 中序 遍历 midOrder()： 中序遍历 二叉树上的每一个结点\r\n⚫ 后序 遍历 postOrder()： 后序遍历 二叉树上的每一个结点\r\n⚫ 层次遍历 levelOrder()：层次遍历二叉树上的每个结点', '未分类', '34059212bfb8d5bbd105f82656ad67da', '2026-03-26 15:25:03', '2026-03-26 15:25:03'),
	(81975e9df6e644c388d7f0afe743aa55, '2711adad139649fba22548ab9c4ef311', 8, '6) Break----------------', '未分类', '62ed33f848a26407c918246dfaafb831', '2026-03-26 15:25:03', '2026-03-26 15:25:03'),
	(83d29942d9ce4651984bf13c39072eb0, '99e80dd5c3dc41e180630df4abc81a0b', 3, '1) Break----------------\r\n3Boyu.AI\r\n二叉树的定义\r\n满二叉树\r\n一棵高度为  k并具有 2k－ 1个结点的二叉树称为满二叉树\r\n除最底层，任意一层的结点个数都达到了最大值\r\nD\r\nC\r\nGEF\r\nB\r\nA\r\nHKIJOLNM\r\n满二叉树实例\r\nD\r\nC\r\nGEF\r\nB\r\nA\r\nHIJ\r\n不是满二叉树', '未分类', '52511395c3b9fba1aef7a6e1cecc1e19', '2026-03-26 15:36:56', '2026-03-26 15:36:56'),
	(a7a828a199b2453a96259c9ecd874f1b, '99e80dd5c3dc41e180630df4abc81a0b', 5, '3) Break----------------\r\n5Boyu.AI\r\n二叉树的定义\r\n二叉树的操作\r\n⚫  建树 create()：创建一棵空树\r\n⚫  清空 clear()：删除树中的所有结点\r\n⚫  判空 IsEmpty()：判别是否为空树\r\n⚫  求树的规模  size()：统计树上的结点数\r\n⚫  找根结点 root()：找出树的根结点值；如果树是空树，则返回一个特殊值\r\n⚫  找父结点 parent(x)：找出结点  x的父结点值；如果  x不存在或 x是根结点，则返回一个特殊值\r\n⚫  找子结点 child(x,i)：找结点 x的第 i个子结点值  ; 如果 x不存在或 x的第 i个儿子不存在，则返回一\r\n个特殊值\r\n⚫  剪枝 remove(x,i)：删除结点  x的第 i棵子树\r\n⚫  遍历 traverse()：访问树上的每一个结点\r\n⚫ lchild(x),  rchild(x)\r\n⚫ delLeft(x),  delRight(x)', '未分类', 'f6cc4ec39a8ee926b3130eead090cc7c', '2026-03-26 15:36:56', '2026-03-26 15:36:56'),
	(b6486ca0967b420fbc71d7dbd6ecf7a9, '99e80dd5c3dc41e180630df4abc81a0b', 2, '0) Break----------------\r\n2Boyu.AI\r\n二叉树的定义\r\n二叉树实例\r\n3个结点组成的树\r\n3个结点组成的二叉树', '未分类', 'a9dfdf37ed33dc477fa8095f5febc606', '2026-03-26 15:36:56', '2026-03-26 15:36:56'),
	(bc36440aaaf845a2930c0ca2027aaeb4, '76dac65b0cae469b8a573ed11ed30e8f', 5, '3) Break----------------\r\n5Boyu.AI\r\n二叉树的定义\r\n二叉树的操作\r\n⚫  建树 create()：创建一棵空树\r\n⚫  清空 clear()：删除树中的所有结点\r\n⚫  判空 IsEmpty()：判别是否为空树\r\n⚫  求树的规模  size()：统计树上的结点数\r\n⚫  找根结点 root()：找出树的根结点值；如果树是空树，则返回一个特殊值\r\n⚫  找父结点 parent(x)：找出结点  x的父结点值；如果  x不存在或 x是根结点，则返回一个特殊值\r\n⚫  找子结点 child(x,i)：找结点 x的第 i个子结点值  ; 如果 x不存在或 x的第 i个儿子不存在，则返回一\r\n个特殊值\r\n⚫  剪枝 remove(x,i)：删除结点  x的第 i棵子树\r\n⚫  遍历 traverse()：访问树上的每一个结点\r\n⚫ lchild(x),  rchild(x)\r\n⚫ delLeft(x),  delRight(x)', '未分类', 'f6cc4ec39a8ee926b3130eead090cc7c', '2026-03-26 15:36:56', '2026-03-26 15:36:56'),
	(d64eb7f83f114ff4a5600eaeaf53a55e, '99e80dd5c3dc41e180630df4abc81a0b', 8, '6) Break----------------', '未分类', '62ed33f848a26407c918246dfaafb831', '2026-03-26 15:36:56', '2026-03-26 15:36:56'),
	(dcfe4caad0564d8fa30d24df25cc5fd9, '76dac65b0cae469b8a573ed11ed30e8f', 6, '4) Break----------------\r\n6Boyu.AI\r\n二叉树的定义\r\n二叉树的操作\r\n⚫ 建树 create()：创建一棵空的二叉树\r\n⚫ 清空 clear()：删除二叉树中的所有结点\r\n⚫ 判空 IsEmpty()：判别二叉树是否为空树\r\n⚫ 求树的规模  size()：统计树上的结点数\r\n⚫ 找根结点 root()：找出二叉树的根结点值；如果树是空树，则返回一个特殊值\r\n⚫ 找父结点 parent(x)：找出结点  x的父结点值；如果  x不存在或 x是根，则返回一个特殊值\r\n⚫ 找左孩子 lchild(x)：找结点 x的左孩子结点值；如果   x不存在或 x的左儿子不存在，则返回\r\n一个特殊值\r\n⚫ 找右孩子 rchild(x)：找结点 x的右孩子结点值；如果   x不存在或 x的右儿子不存在，则返回\r\n一个特殊值\r\n⚫ 删除左子树  delLeft(x)：删除结点  x的左子树\r\n⚫ 删除右子树  delRight(x)：删除结点  x的右子树\r\n⚫ 前序 遍历 preOrder()： 前序遍历 二叉树上的每一个结点\r\n⚫ 中序 遍历 midOrder()： 中序遍历 二叉树上的每一个结点\r\n⚫ 后序 遍历 postOrder()： 后序遍历 二叉树上的每一个结点\r\n⚫ 层次遍历 levelOrder()：层次遍历二叉树上的每个结点', '未分类', '34059212bfb8d5bbd105f82656ad67da', '2026-03-26 15:36:56', '2026-03-26 15:36:56'),
	(ee26e4d93c9c475ba374fc483beb91bb, '2711adad139649fba22548ab9c4ef311', 4, '2) Break----------------\r\n4Boyu.AI\r\n二叉树的定义\r\n完全二叉树\r\n在满二叉树的最底层自右至左依次     (注意：不能跳过\r\n任何一个结点  )去掉若干个结点得到的二叉树也被称\r\n之为完全二叉树  。 满二叉树一定是完全二叉树    ， 但\r\n完全二叉树不一定是满二叉树    。\r\n特点：\r\n （1）所有的叶结点都出现在最低的两层上     。\r\n （ 2）对任一结点，如果其右子树的高度为     k，\r\n则其左子树的高度为   k或 k＋ 1。  \r\nD\r\nC\r\nGE              F\r\nB\r\nA\r\nK                             OL              NM\r\nD\r\nC\r\nGE            F\r\nB\r\nA\r\nH     I      J\r\n完全二叉树\r\n不是完全二叉树', '未分类', 'fdcfc07bc912ba70875cac248bae51c7', '2026-03-26 15:25:03', '2026-03-26 15:25:03'),
	(f4a2984c576b449baf878269f87c40a4, '76dac65b0cae469b8a573ed11ed30e8f', 3, '1) Break----------------\r\n3Boyu.AI\r\n二叉树的定义\r\n满二叉树\r\n一棵高度为  k并具有 2k－ 1个结点的二叉树称为满二叉树\r\n除最底层，任意一层的结点个数都达到了最大值\r\nD\r\nC\r\nGEF\r\nB\r\nA\r\nHKIJOLNM\r\n满二叉树实例\r\nD\r\nC\r\nGEF\r\nB\r\nA\r\nHIJ\r\n不是满二叉树', '未分类', '52511395c3b9fba1aef7a6e1cecc1e19', '2026-03-26 15:36:56', '2026-03-26 15:36:56'),
	(f8f11f87af7c4ccba284a8e92042d097, '99e80dd5c3dc41e180630df4abc81a0b', 4, '2) Break----------------\r\n4Boyu.AI\r\n二叉树的定义\r\n完全二叉树\r\n在满二叉树的最底层自右至左依次     (注意：不能跳过\r\n任何一个结点  )去掉若干个结点得到的二叉树也被称\r\n之为完全二叉树  。 满二叉树一定是完全二叉树    ， 但\r\n完全二叉树不一定是满二叉树    。\r\n特点：\r\n （1）所有的叶结点都出现在最低的两层上     。\r\n （ 2）对任一结点，如果其右子树的高度为     k，\r\n则其左子树的高度为   k或 k＋ 1。  \r\nD\r\nC\r\nGE              F\r\nB\r\nA\r\nK                             OL              NM\r\nD\r\nC\r\nGE            F\r\nB\r\nA\r\nH     I      J\r\n完全二叉树\r\n不是完全二叉树', '未分类', 'fdcfc07bc912ba70875cac248bae51c7', '2026-03-26 15:36:56', '2026-03-26 15:36:56');

-- 导出  表 study_backend.notes 结构
DROP TABLE IF EXISTS `notes`;
CREATE TABLE IF NOT EXISTS `notes` (
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 正在导出表  study_backend.notes 的数据：~1 rows (大约)
DELETE FROM `notes`;
INSERT INTO `notes` (`id`, `note_id`, `user_id`, `file_name`, `content`, `status`, `create_time`, `update_time`) VALUES
	(2, '9ef4887a9b8f46d384bed2924b506d74', '1', '�\\���.pdf', '作业一\r\n1.模型预测:哪个多预测成哪个,一样多随机预测\r\n留一法:留一个作测试集,其余为训练集\r\n两种情况:\r\n①留下的为正例:训练集99个样本,49正例50负例\r\n预测结果为负例(50>4P)\r\n预测错误,并且发生50次(50个正例轮流被留下)\r\n②留下的为负例:训练样本99个,49负例50正例\r\n预测结果为正例(50>49)\r\n预测错误.发生50次\r\n错误率:错误新测数50+50=1=100%\r\n2.设回归方程:y=wx+b\r\nx为温度,y为得率,n=10\r\nx==100+110+120++190=145\r\n==40+44+50++83=60.5\r\n(xi-x)(yi-)\r\n利用最小=乘法w=(xi-x)2\r\n分子=3900分母=8250\r\n代入原式W=≈0.4727\r\nb=y-wx=60.5-0.4727x145=-8.0415\r\ny=0.4727x-8.0415', 1, '2026-03-26 10:10:14', '2026-03-26 10:10:16');

-- 导出  表 study_backend.pii_record 结构
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='PII敏感信息检测记录表';

-- 正在导出表  study_backend.pii_record 的数据：~1 rows (大约)
DELETE FROM `pii_record`;
INSERT INTO `pii_record` (`id`, `resource_id`, `user_id`, `content`, `has_pii`, `pii_list`, `create_time`, `update_time`) VALUES
	(1, 'eb7a7af604054c42ac80588771881152', 'test001', '我的手机号是 13800138000，邮箱是 test@xxx.com', 1, '[{"type": "phone", "values": ["13800138000"]}, {"type": "email", "values": ["test@xxx.com"]}]', '2026-03-26 10:46:23', '2026-03-26 10:46:23');

-- 导出  表 study_backend.resource 结构
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
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='资源表';

-- 正在导出表  study_backend.resource 的数据：~11 rows (大约)
DELETE FROM `resource`;
INSERT INTO `resource` (`id`, `resource_id`, `user_id`, `file_name`, `file_type`, `subject`, `file_size`, `file_hash`, `privacy_level`, `parse_status`, `storage_path`, `file_duration`, `file_resolution`, `third_party_type`, `third_party_url`, `third_party_status`, `is_delete`, `create_time`, `update_time`) VALUES
	(6, 'a96903a16b4d4a6badae137c3fb39b64', 'test001', '程序设计网课.mp4', 'other', '未分类', 16303790, 'ee32407af439fd0d9abd06933543bfec', 0, 1, 'D:\\软创大赛\\study-Backend\\storage\\temp\\baa99bb4e1dfad12725067a4d3491913', 0, '', NULL, NULL, 0, 0, '2026-03-25 15:54:51', '2026-03-25 15:54:51'),
	(7, '7861db0d32bf4b59a8ce4e4f04a1a7a3', 'test001', '二叉树PPT.pdf', 'pdf', '未分类', 119640, '0ff418c480bff6ea32e46ccc5089f288', 0, 1, 'D:\\软创大赛\\study-Backend\\storage\\temp\\9cd3bd6a13546ea695acfa2dca232650', 0, '', NULL, NULL, 0, 0, '2026-03-25 15:54:51', '2026-03-25 15:54:51'),
	(8, '17e839fca2f44b43ae3cfeec55eb4559', 'test001', '计算机网络-物理层.pdf', 'pdf', '未分类', 33060442, 'ff81c8538e80f49d90fcf3ec8722d4f8', 0, 1, 'D:\\软创大赛\\study-Backend\\storage\\temp\\201784a6e5070590ea9a85871fed5c2f', 0, '', NULL, NULL, 0, 0, '2026-03-25 15:54:51', '2026-03-25 15:54:51'),
	(9, 'b4c0d5301b7446b398d7627a37679b95', 'test001', '计算机网络应用层PPT.pptx', 'pptx', '未分类', 10073666, '13bfbc8d4ce33ef227746d34c7568fe6', 0, 1, 'D:\\软创大赛\\study-Backend\\storage\\temp\\2d302a760810f51ded2d8c7a44134dee', 0, '', NULL, NULL, 0, 0, '2026-03-25 15:54:51', '2026-03-25 15:54:51'),
	(10, 'dd36a4ed9c3d41cf9821b516f70dc7c9', 'test001', '计算机组成原理-简单计算处理.pdf', 'pdf', '未分类', 861320, '4fdfc4f0c35b568042697068a80f7607', 0, 1, 'D:\\软创大赛\\study-Backend\\storage\\temp\\bd97bcc9dbcb90db14c7d1569da0541d', 0, '', NULL, NULL, 0, 0, '2026-03-25 15:54:51', '2026-03-25 15:54:51'),
	(11, 'eb7a7af604054c42ac80588771881152', 'test001', '计算机组成原理-数字表示方式.pdf', 'pdf', '未分类', 939842, '00bc47f07bd7cae667c3147221a5d1db', 0, 1, 'D:\\软创大赛\\study-Backend\\storage\\temp\\4071b3ebdddc9374da793d9394b6b224', 0, '', NULL, NULL, 0, 0, '2026-03-25 15:54:51', '2026-03-25 15:54:51'),
	(12, '0ffb34fb5a0b44e5a1b5575a1483b2d1', 'test001', '计网实验第1课.mp4', 'other', '未分类', 3129531, '65869ef3059164a8babaf2220d5350dc', 0, 1, 'D:\\软创大赛\\study-Backend\\storage\\temp\\653f22c7ed68135a31f8bd125edb1e45', 0, '', NULL, NULL, 0, 0, '2026-03-25 15:54:51', '2026-03-25 15:54:51'),
	(14, '2a1d01d96f7547719d8c13c62b02663d', 'test002', '操作系统作业.pdf', 'pdf', '未分类', 1238703, '10c170bf92e9abb97a1076323708f3a5', 0, 1, 'D:\\软创大赛\\study-Backend\\storage\\temp\\eef560b7dfde961e2e878a8ea3b7c773', 0, '', NULL, NULL, 0, 0, '2026-03-25 15:59:14', '2026-03-25 15:59:14'),
	(15, 'dfdbb01c5aa4450ea6510fa863fcb424', 'test001', '理论力学笔记.pdf', 'pdf', '未分类', 21761396, '929f1a51e3b01070723d97c3f0aaae66', 0, 1, 'D:\\软创大赛\\study-Backend\\storage\\temp\\dda2b36e6a067b04ea58af4866df7d9c', 0, '', NULL, NULL, 0, 0, '2026-03-26 09:34:52', '2026-03-26 09:34:52'),
	(25, '99e80dd5c3dc41e180630df4abc81a0b', 'test001', 'test1.pdf', 'pdf', '未分类', 119640, '0ff418c480bff6ea32e46ccc5089f288', 0, 2, 'D:\\myGithub\\studyBackend\\storage\\temp\\00880e6cafd9f30c29297e33418ab80b', 0, '', NULL, NULL, 0, 0, '2026-03-26 15:36:54', '2026-03-26 15:36:56'),
	(26, '76dac65b0cae469b8a573ed11ed30e8f', 'test001', 'test.pdf', 'pdf', '未分类', 119640, '0ff418c480bff6ea32e46ccc5089f288', 0, 2, 'D:\\myGithub\\studyBackend\\storage\\temp\\87e3760cc78ff226a1bdf336944ae152', 0, '', NULL, NULL, 0, 0, '2026-03-26 15:36:54', '2026-03-26 15:36:56');

-- 导出  表 study_backend.third_party_file 结构
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

-- 正在导出表  study_backend.third_party_file 的数据：~0 rows (大约)
DELETE FROM `third_party_file`;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
