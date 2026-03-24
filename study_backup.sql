-- 创建数据库
CREATE DATABASE IF NOT EXISTS study_backend DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE study_backend;

-- 管理员表
DROP TABLE IF EXISTS admin;
CREATE TABLE admin (
                       id INT AUTO_INCREMENT PRIMARY KEY,
                       admin_id VARCHAR(32) NOT NULL,
                       account VARCHAR(50) NOT NULL UNIQUE,
                       password VARCHAR(64) NOT NULL,
                       nickname VARCHAR(50) DEFAULT '默认管理员',
                       create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                       update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表';

-- 资源表（PPT/PDF/音视频/第三方文件）
DROP TABLE IF EXISTS resource;
CREATE TABLE resource (
                          id INT AUTO_INCREMENT PRIMARY KEY,
                          resource_id VARCHAR(32) NOT NULL UNIQUE,
                          user_id VARCHAR(50) NOT NULL,
                          file_name VARCHAR(255) NOT NULL,
                          file_type VARCHAR(20) DEFAULT 'other',
                          file_size BIGINT DEFAULT 0,
                          file_hash VARCHAR(32) DEFAULT '',
                          privacy_level TINYINT DEFAULT 0,
                          parse_status TINYINT DEFAULT 0,
                          storage_path VARCHAR(500) DEFAULT '',
                          file_duration INT DEFAULT 0,
                          file_resolution VARCHAR(50) DEFAULT '',
                          third_party_type VARCHAR(20) NULL,
                          third_party_url VARCHAR(500) NULL,
                          third_party_status TINYINT DEFAULT 0,
                          is_delete TINYINT DEFAULT 0,
                          create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                          update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                          INDEX idx_user_id (user_id),
                          INDEX idx_file_type (file_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资源表';

-- 敏感信息识别记录表
DROP TABLE IF EXISTS pii_record;
CREATE TABLE pii_record (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            resource_id VARCHAR(32) NOT NULL,
                            user_id VARCHAR(50) NOT NULL,
                            pii_type VARCHAR(20) NOT NULL,
                            pii_value VARCHAR(255) NOT NULL,
                            position VARCHAR(100) DEFAULT '',
                            create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                            INDEX idx_resource_id (resource_id),
                            INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='敏感信息识别记录表';

-- 音视频解析记录表
DROP TABLE IF EXISTS audio_video_parse;
CREATE TABLE audio_video_parse (
                                   id INT AUTO_INCREMENT PRIMARY KEY,
                                   resource_id VARCHAR(32) NOT NULL UNIQUE,
                                   user_id VARCHAR(50) NOT NULL,
                                   audio_text LONGTEXT NULL,
                                   sensitive_frames INT DEFAULT 0,
                                   parse_status TINYINT DEFAULT 0,
                                   create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                                   update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                   INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='音视频解析记录表';

-- 第三方文件记录表
DROP TABLE IF EXISTS third_party_file;
CREATE TABLE third_party_file (
                                  id INT AUTO_INCREMENT PRIMARY KEY,
                                  resource_id VARCHAR(32) NOT NULL,
                                  user_id VARCHAR(50) NOT NULL,
                                  third_type VARCHAR(20) NOT NULL,
                                  origin_url VARCHAR(500) NOT NULL,
                                  local_path VARCHAR(500) DEFAULT '',
                                  download_status TINYINT DEFAULT 0,
                                  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                                  INDEX idx_resource_id (resource_id),
                                  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='第三方文件记录表';

DROP TABLE IF EXISTS feynman_record;
CREATE TABLE feynman_record (
                                id INT AUTO_INCREMENT PRIMARY KEY,
                                record_id VARCHAR(32) NOT NULL UNIQUE,
                                user_id VARCHAR(50) NOT NULL,
                                resource_id VARCHAR(32) NULL COMMENT '联动的专属资源ID(可为空)',
                                knowledge_point VARCHAR(100) NOT NULL COMMENT '考察的知识点',
                                question_text TEXT NOT NULL COMMENT 'AI生成的问题',
                                hints JSON NULL COMMENT 'AI生成的提示词',
                                user_answer TEXT NULL COMMENT '用户提交的答案',
                                reference_context TEXT NULL COMMENT '从LanceDB或解析表抽取的标准参考文本',
                                score INT DEFAULT 0 COMMENT '综合评分(0-100)',
                                covered_points JSON NULL COMMENT '已覆盖知识点',
                                missing_points JSON NULL COMMENT '缺失知识点',
                                logic_flaws JSON NULL COMMENT '逻辑断层',
                                feedback TEXT NULL COMMENT '总体评价',
                                status TINYINT DEFAULT 0 COMMENT '0:待回答, 1:已评估',
                                create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                                update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                INDEX idx_user_id (user_id),
                                INDEX idx_resource_id (resource_id),
                                INDEX idx_knowledge_point (knowledge_point)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='费曼问答记录表（包含资源联动）';

USE study_backend;

DROP TABLE IF EXISTS feynman_record;
CREATE TABLE feynman_record (
                                id INT AUTO_INCREMENT PRIMARY KEY,
                                record_id VARCHAR(32) NOT NULL UNIQUE,
                                user_id VARCHAR(50) NOT NULL,
                                resource_id VARCHAR(32) NULL COMMENT '联动的专属资源ID(可为空)',
                                knowledge_point VARCHAR(100) NOT NULL COMMENT '考察的知识点',
                                question_text TEXT NOT NULL COMMENT 'AI生成的问题',
                                hints JSON NULL COMMENT 'AI生成的提示词',
                                user_answer TEXT NULL COMMENT '用户提交的答案',
                                reference_context TEXT NULL COMMENT '从LanceDB或解析表抽取的标准参考文本',
                                score INT DEFAULT 0 COMMENT '综合评分(0-100)',
                                covered_points JSON NULL COMMENT '已覆盖知识点',
                                missing_points JSON NULL COMMENT '缺失知识点',
                                logic_flaws JSON NULL COMMENT '逻辑断层',
                                feedback TEXT NULL COMMENT '总体评价',
                                status TINYINT DEFAULT 0 COMMENT '0:待回答, 1:已评估',
                                create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                                update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                INDEX idx_user_id (user_id),
                                INDEX idx_resource_id (resource_id),
                                INDEX idx_knowledge_point (knowledge_point)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='费曼问答记录表（包含资源联动）';
