import { VillaController } from "../controllers/villaController.js";
import { Router } from "express";
const villaRouter = Router();

villaRouter.get("/", VillaController.getAllVillas);
villaRouter.get("/occupied", VillaController.getOccupiedVillas);
villaRouter.get('/summaries', VillaController.getVillaSummaries); 
villaRouter.get("/:id", VillaController.getVillaById);
villaRouter.post("/", VillaController.createVilla);
villaRouter.patch("/:id", VillaController.updateVilla); 
villaRouter.delete("/:id", VillaController.deleteVilla);


export default villaRouter;
