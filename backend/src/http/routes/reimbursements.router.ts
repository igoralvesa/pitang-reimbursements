import express from 'express';
import { requireRole } from '../middlewares/require-role.middleware';

import {
  deleteUser,
  getUser,
  getUsers,
  patchUser,
  postUser,
  promoteUser,
} from '../controllers/reimbursement';

const reimbursementRouter = express.Router();

reimbursementRouter.get('/', requireRole('ADMIN'), postUser);
reimbursementRouter.post(
  '/',
  requireRole('ADMIN', 'COLLABORATOR'),
  promoteUser,
);
reimbursementRouter.get('/:id', requireRole('ADMIN'), getUsers);
reimbursementRouter.put('/:id', requireRole('ADMIN'), getUser);
reimbursementRouter.post('/:id/submit', requireRole('ADMIN'), patchUser);
reimbursementRouter.post('/:id/approve', requireRole('ADMIN'), deleteUser);
reimbursementRouter.post('/:id/reject', requireRole('ADMIN'), deleteUser);
reimbursementRouter.post('/:id/pay', requireRole('ADMIN'), deleteUser);
reimbursementRouter.get('/:id/history', requireRole('ADMIN'), deleteUser);
reimbursementRouter.post('/:id/attachments', requireRole('ADMIN'), deleteUser);
reimbursementRouter.get('/:id/attachments', requireRole('ADMIN'), deleteUser);

export default reimbursementRouter;
