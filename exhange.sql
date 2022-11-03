CREATE TABLE `crypto` (
  `crypto_name` varchar(45) NOT NULL,
  `abbreviation` varchar(45) NOT NULL,
  PRIMARY KEY (`crypto_name`),
  UNIQUE KEY `crypto_name_UNIQUE` (`crypto_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
CREATE TABLE `follow` (
  `id_string` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `crypto_name` varchar(45) NOT NULL,
  `currency_pair` varchar(45) NOT NULL,
  PRIMARY KEY (`id_string`),
  UNIQUE KEY `follow_user_crypto` (`user_id`,`crypto_name`),
  KEY `user_id_idx` (`user_id`),
  KEY `fk_crypto_name_idx` (`crypto_name`),
  CONSTRAINT `fk_crypto_name` FOREIGN KEY (`crypto_name`) REFERENCES `crypto` (`crypto_name`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
CREATE TABLE `user` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `telegram_id` int NOT NULL,
  `query_schedule` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `telegram_id_UNIQUE` (`telegram_id`),
  UNIQUE KEY `user_id_UNIQUE` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci