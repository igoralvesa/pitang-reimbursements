import express from 'express';
import { Role } from '../../types/roles-enum';
import { reimbursementAttachmentUploadMiddleware } from '../middlewares/reimbursement-attachment-upload.middleware';
import { requireRole } from '../middlewares/require-role.middleware';

import {
  getReimbursement,
  getReimbursements,
  updateReimbursement,
  postReimbursement,
  submitReimbursement,
  approveReimbursement,
  cancelReimbursement,
  rejectReimbursement,
  payReimbursement,
  getReimbursementHistory,
  uploadReimbursementAttachments,
  getReimbursementAttachments,
} from '../controllers/reimbursements';

const reimbursementRouter = express.Router();

reimbursementRouter.get(
  '/',
  requireRole(Role.ADMIN, Role.COLLABORATOR, Role.MANAGER, Role.FINANCE),
  getReimbursements,
);

reimbursementRouter.post(
  '/',
  requireRole(Role.COLLABORATOR),
  postReimbursement,
);

reimbursementRouter.get(
  '/:id',
  requireRole(Role.ADMIN, Role.COLLABORATOR, Role.MANAGER, Role.FINANCE),
  getReimbursement,
);

reimbursementRouter.put(
  '/:id',
  requireRole(Role.COLLABORATOR),
  updateReimbursement,
);

reimbursementRouter.post(
  '/:id/submit',
  requireRole(Role.COLLABORATOR),
  submitReimbursement,
);

reimbursementRouter.post(
  '/:id/cancel',
  requireRole(Role.COLLABORATOR),
  cancelReimbursement,
);

reimbursementRouter.post(
  '/:id/approve',
  requireRole(Role.MANAGER),
  approveReimbursement,
);

reimbursementRouter.post(
  '/:id/reject',
  requireRole(Role.MANAGER),
  rejectReimbursement,
);

reimbursementRouter.post(
  '/:id/pay',
  requireRole(Role.FINANCE),
  payReimbursement,
);

reimbursementRouter.get(
  '/:id/history',
  requireRole(Role.ADMIN, Role.COLLABORATOR, Role.MANAGER, Role.FINANCE),
  getReimbursementHistory,
);

reimbursementRouter.post(
  '/:id/attachments',
  requireRole(Role.COLLABORATOR),
  reimbursementAttachmentUploadMiddleware,
  uploadReimbursementAttachments,
);

reimbursementRouter.get(
  '/:id/attachments',
  requireRole(Role.COLLABORATOR, Role.MANAGER, Role.FINANCE, Role.ADMIN),
  getReimbursementAttachments,
);

export default reimbursementRouter;
