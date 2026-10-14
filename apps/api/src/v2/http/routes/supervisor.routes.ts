import { Router } from 'express';

import { asyncHandler } from '../../../http/asyncHandler';
import {
    assignCleaner,
    supervisorDashboard,
    supervisorEndorse,
    supervisorList,
    supervisorReject,
    type ReportV2Status
} from '../../reports/reports.service';
import { requireV2Auth, requireV2Role } from '../auth.middleware';
import { ok } from '../envelope';
import {
    AssignCleanerSchema,
    EndorseSchema,
    RejectSchema,
    SupervisorListQuerySchema,
    VolunteerListQuerySchema
} from '../schemas';
import { mutationEnvelope, serializeReportSummary, serializeVolunteerRequest } from '../serializers';
import { validateV2 } from '../validate';
import {
    listVolunteerRequests,
    rejectVolunteerRequest,
    type VolunteerRequestStatus
} from '../../volunteer/volunteer.service';

export function buildSupervisorV2Router(): Router {
    const router = Router();
    // Every supervisor endpoint requires the supervisor capability.
    router.use(requireV2Auth, requireV2Role('supervisor'));

    // GET /api/v2/supervisor/dashboard
    router.get(
        '/dashboard',
        asyncHandler(async (_req, res) => {
            const { summary, recent } = await supervisorDashboard();
            ok(res, {
                summary,
                recent_reports: recent.map(serializeReportSummary)
            });
        })
    );

    // GET /api/v2/supervisor/reports
    router.get(
        '/reports',
        validateV2(SupervisorListQuerySchema, 'query'),
        asyncHandler(async (req, res) => {
            const q = req.query as { status?: ReportV2Status; page?: number; limit?: number };
            const { reports, total, page, limit } = await supervisorList(q);
            ok(
                res,
                { reports: reports.map(serializeReportSummary) },
                { page, limit, total }
            );
        })
    );

    // PATCH /api/v2/supervisor/reports/:id/assign
    router.patch(
        '/reports/:id/assign',
        validateV2(AssignCleanerSchema, 'body'),
        asyncHandler(async (req, res) => {
            const ctx = req.v2Auth!;
            const result = await assignCleaner(ctx, String(req.params.id), req.body);
            ok(res, mutationEnvelope(result));
        })
    );

    // PATCH /api/v2/supervisor/reports/:id/endorse
    router.patch(
        '/reports/:id/endorse',
        validateV2(EndorseSchema, 'body'),
        asyncHandler(async (req, res) => {
            const ctx = req.v2Auth!;
            const result = await supervisorEndorse(ctx, String(req.params.id), req.body);
            ok(res, mutationEnvelope(result));
        })
    );

    // PATCH /api/v2/supervisor/reports/:id/reject
    router.patch(
        '/reports/:id/reject',
        validateV2(RejectSchema, 'body'),
        asyncHandler(async (req, res) => {
            const ctx = req.v2Auth!;
            const result = await supervisorReject(ctx, String(req.params.id), req.body);
            ok(res, mutationEnvelope(result));
        })
    );

    // GET /api/v2/supervisor/volunteer-requests?status=&page=&limit=
    // Queue of cleaner volunteer requests (default: all, newest first).
    router.get(
        '/volunteer-requests',
        validateV2(VolunteerListQuerySchema, 'query'),
        asyncHandler(async (req, res) => {
            const q = req.query as { status?: VolunteerRequestStatus; page?: number; limit?: number };
            const { requests, total, page, limit } = await listVolunteerRequests(q);
            ok(
                res,
                { volunteer_requests: requests.map(serializeVolunteerRequest) },
                { page, limit, total }
            );
        })
    );

    // PATCH /api/v2/supervisor/volunteer-requests/:id/reject
    // Decline a pending request. Approval happens via PATCH /reports/:id/assign.
    router.patch(
        '/volunteer-requests/:id/reject',
        validateV2(RejectSchema, 'body'),
        asyncHandler(async (req, res) => {
            const ctx = req.v2Auth!;
            const { request, cursor } = await rejectVolunteerRequest(
                ctx,
                String(req.params.id),
                req.body
            );
            ok(res, {
                volunteer_request: serializeVolunteerRequest(request),
                sync: { cursor }
            });
        })
    );

    return router;
}
