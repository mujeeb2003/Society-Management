-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `first_name` VARCHAR(191) NOT NULL,
    `last_name` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `villas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `villa_number` VARCHAR(191) NOT NULL,
    `resident_name` VARCHAR(191) NULL,
    `occupancy_type` ENUM('OWNER', 'TENANT', 'VACANT') NOT NULL DEFAULT 'VACANT',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `villas_villa_number_key`(`villa_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `is_recurring` BOOLEAN NOT NULL DEFAULT true,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payment_categories_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `villa_id` INTEGER NOT NULL,
    `category_id` INTEGER NULL,
    `receivable_amount` DECIMAL(10, 2) NOT NULL,
    `received_amount` DECIMAL(10, 2) NOT NULL,
    `payment_date` DATETIME(3) NOT NULL,
    `payment_month` INTEGER NOT NULL,
    `payment_year` INTEGER NOT NULL,
    `payment_method` ENUM('CASH', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE') NOT NULL DEFAULT 'CASH',
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `payments_villa_id_payment_date_idx`(`villa_id`, `payment_date`),
    INDEX `payments_payment_month_payment_year_idx`(`payment_month`, `payment_year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expenses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `expense_date` DATETIME(3) NOT NULL,
    `expense_month` INTEGER NOT NULL,
    `expense_year` INTEGER NOT NULL,
    `payment_method` ENUM('CASH', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE') NOT NULL DEFAULT 'CASH',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `expenses_expense_month_expense_year_idx`(`expense_month`, `expense_year`),
    INDEX `expenses_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `monthly_balances` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `month` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `total_receipts` DECIMAL(15, 2) NOT NULL,
    `total_expenses` DECIMAL(15, 2) NOT NULL,
    `previous_balance` DECIMAL(15, 2) NOT NULL,
    `current_balance` DECIMAL(15, 2) NOT NULL,
    `is_generated` BOOLEAN NOT NULL DEFAULT false,
    `generated_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `monthly_balances_year_month_idx`(`year`, `month`),
    UNIQUE INDEX `monthly_balances_month_year_key`(`month`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_villa_id_fkey` FOREIGN KEY (`villa_id`) REFERENCES `villas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `payment_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
