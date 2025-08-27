CREATE TABLE
similar_products(
id SERIAL PRIMARY KEY,
product_id VARCHAR(36) NOT NULL,   - (тут похожий товар и ниже его данные)
title VARCHAR(255) DEFAULT NULL,
description VARCHAR(255) DEFAULT NULL,
price VARCHAR(36) DEFAULT NULL,
related_product_id VARCHAR(36) NOT NULL,   - (это айди товара на который он похож)
FOREIGN KEY (product_id) REFERENCES products(product_id),
FOREIGN KEY (related_product_id) REFERENCES products(product_id)
)

