import { Router } from "express";
import { BackupController } from "../controllers/backupController.js";

const backupRouter = Router();

backupRouter.get("/generate", BackupController.generateBackup);
backupRouter.get("/info", BackupController.getBackupInfo);

export default backupRouter;
