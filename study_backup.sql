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

-- 正在导出表  study_backend.admin 的数据：~0 rows (大约)
DELETE FROM `admin`;

-- 导出  表 study_backend.audio_video_parse 结构
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

-- 正在导出表  study_backend.feynman_record 的数据：~0 rows (大约)
DELETE FROM `feynman_record`;

-- 导出  表 study_backend.material_chunk 结构
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

-- 正在导出表  study_backend.material_chunk 的数据：~0 rows (大约)
DELETE FROM `material_chunk`;

-- 导出  表 study_backend.pii_record 结构
CREATE TABLE IF NOT EXISTS `pii_record` (
  `id` int NOT NULL AUTO_INCREMENT,
  `resource_id` varchar(32) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `pii_type` varchar(20) NOT NULL,
  `pii_value` varchar(255) NOT NULL,
  `position` varchar(100) DEFAULT '',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_resource_id` (`resource_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='敏感信息识别记录表';

-- 正在导出表  study_backend.pii_record 的数据：~0 rows (大约)
DELETE FROM `pii_record`;

-- 导出  表 study_backend.resource 结构
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

-- 正在导出表  study_backend.resource 的数据：~0 rows (大约)
DELETE FROM `resource`;

-- 导出  表 study_backend.third_party_file 结构
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
