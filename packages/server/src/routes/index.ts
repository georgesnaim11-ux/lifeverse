import { Router } from 'express';
import { characterRouter } from './character.routes.js';
import { gameRouter } from './game.routes.js';
import { saveRouter } from './save.routes.js';
import { activityRouter } from './activity.routes.js';
import { careerRouter } from './career.routes.js';
import { educationRouter } from './education.routes.js';
import { shoppingRouter } from './shopping.routes.js';
import { relationshipRouter } from './relationship.routes.js';
import { housingRouter } from './housing.routes.js';
import { garageRouter } from './garage.routes.js';
import { shopRouter } from './shop.routes.js';

export const router = Router();

router.use('/character', characterRouter);
router.use('/game', gameRouter);
router.use('/save', saveRouter);
router.use('/activity', activityRouter);
router.use('/career', careerRouter);
router.use('/education', educationRouter);
router.use('/shop', shoppingRouter);
router.use('/relationship', relationshipRouter);
router.use('/housing', housingRouter);
router.use('/garage', garageRouter);
router.use('/collectibles', shopRouter);
