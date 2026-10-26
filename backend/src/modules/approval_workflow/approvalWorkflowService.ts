import type {
  ApprovalWorkflowRepository,
  ApprovalLevelData,
  ApprovalWorkflowDefinitionData,
  GetData,
  ApprovalRequest,
  UpdateRequestStatusData,
  roleCheck,
  ApprovalActionData,
  ApprovalRequestData,
  ApprovalRequestStatus,
} from "./approvalWorkflowRepository.js";
import { EventBus } from "../../shared/events/eventBus.js";
import type {
  CreateLevels,
  CreateWorkflow,
} from "./approvalWorkflowValidator.js";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedAccessError,
  ValidationError,
} from "../../shared/errors/appError.js";
import { Decimal } from "decimal.js";

interface AuthenticatedUser {
  userId: string;
  approvalWorkflowId?: string | null;
  status?: ApprovalRequestStatus;
}

interface CreateApprovalWorkflowRequest {
  purchaseRequisitionId: string;
  tenantId: string;
  companyId: string;
  userId: string;
  workflowCode: string;
  entityType: string;
  submitted_At: Date;
}

interface ApprovalContext {
  approvalWorkflow_id: string;
  user_id: string;
}

interface RejectionContext {
  approvalWorkflow_id: string;
  user_id: string;
  remarks: string;
}

export class ApprovalWorkflowService {
  constructor(
    private repository: ApprovalWorkflowRepository,
    private eventBus: EventBus,
  ) {}

  private async checkMembership(userId: string) {
    const membership = await this.repository.findActiveByUserId(userId);

    if (!membership) {
      throw new NotFoundError("User has no active company membership");
    }

    return membership;
  }

  private async checkWorkflow(
    approvalWorkflow_id: string,
    tenantId: string,
    company_id: string,
  ) {
    const approval: ApprovalRequest = {
      approvalWorkflow_id,
      tenant_id: tenantId,
      company_id,
    };

    const checkRequest = await this.repository.getApprovalRequestById(approval);

    if (!checkRequest) {
      throw new NotFoundError(
        "The approval request does not exist or is inaccessible.",
      );
    }

    return checkRequest;
  }

  private async checkAuthorizationRole(
    userId: string,
    tenantId: string,
    companyId: string,
    workflowId: string,
    currentLevel: number,
  ): Promise<void> {
    const role: roleCheck = {
      user_id: userId,
      tenant_id: tenantId,
      company_id: companyId,
    };

    const userRole = await this.repository.findUserRole(role);

    if (!userRole) {
      throw new UnauthorizedAccessError("User does not have an assigned role.");
    }

    const levels = await this.repository.getLevels(
      companyId,
      tenantId,
      workflowId,
    );

    if (!levels || levels.length === 0) {
      throw new UnauthorizedAccessError(
        "No approval workflow level is configured.",
      );
    }

    const currentApprovalLevel = levels.find(
      (level) => level.level_no === currentLevel,
    );

    if (!currentApprovalLevel) {
      throw new UnauthorizedAccessError(
        "The current approval level is not configured.",
      );
    }

    if (userRole.role_id !== currentApprovalLevel.role_id) {
      throw new UnauthorizedAccessError(
        "You are not authorized to perform this action at the current approval level.",
      );
    }
  }

  private async levelAssignment(input: {
    purchaseRequisitionId: string;
    tenantId: string;
    companyId: string;
    workflowId: string;
  }) {
    const requisition = await this.repository.findRequisitionById({
      purchaseRequisition_id: input.purchaseRequisitionId,
      tenant_id: input.tenantId,
      company_id: input.companyId,
    });

    if (!requisition) {
      throw new NotFoundError(
        "Purchase Requisition does not exist or is inaccessible.",
      );
    }
    const levels = await this.repository.getLevels(
      requisition.company_id,
      requisition.tenant_id,
      input.workflowId,
    );

    if (!levels.length) {
      throw new NotFoundError("No approval workflow levels are configured");
    }

    const level = levels.find((level) => {
      const meetsMinimum =
        level.min_amount === null ||
        requisition.total_amount >= level.min_amount;

      const meetsMaximum =
        level.max_amount === null ||
        requisition.total_amount <= level.max_amount;

      return meetsMinimum && meetsMaximum;
    });

    if (!level) {
      throw new NotFoundError(
        "No approval level matches the purchase requisition amount",
      );
    }

    return level.level_no;
  }

  async createApprovalRequest(event: CreateApprovalWorkflowRequest) {
    /*
            1. Validates if the purchase requisition exists
               and belongs to the tenant/company from the event.

            2. Gets the entity type from the event.

            3. Finds the active ApprovalWorkflow that applies
               to the tenant/company and entity type.

            4. Determines the applicable workflow level based
               on the purchase requisition's estimated amount.

            5. Sets the initial approval request state:
               - current_level = 1
               - status = pending
               - requester_user_id = event.userId
               - entity_id = event.purchaseRequisitionId

            6. Compiles the approval request data into an object.

            7. Passes the object to the repository for creation.

            8. Returns the created approval request.
        */

    const workflow = await this.repository.findApprovalWorkflowDefinition(
      event.workflowCode,
      event.tenantId,
      event.companyId,
    );

    if (!workflow) {
      throw new NotFoundError("Approval workflow does not exist");
    }

    const existingRequest = await this.repository.findApprovalRequestByEntity({
      tenant_id: event.tenantId,
      company_id: event.companyId,
      entity_id: event.purchaseRequisitionId,
    });

    if (existingRequest) {
      return existingRequest;
    }

    const currentLevel = await this.levelAssignment({
      purchaseRequisitionId: event.purchaseRequisitionId,
      tenantId: event.tenantId,
      companyId: event.companyId,
      workflowId: workflow.id,
    });

    const approvalRequest: ApprovalRequestData = {
      tenant_id: event.tenantId,
      company_id: event.companyId,
      entity_type: workflow.entity_type,
      entity_id: event.purchaseRequisitionId,
      requester_user_id: event.userId,
      current_level: currentLevel,
      status: "PENDING",
      submitted_at: event.submitted_At,
    };

    return await this.repository.createApprovalRequest(approvalRequest);
  }

  async approveRequest(input: ApprovalContext) {
    /*
            1. Finds the ApprovalRequest using the provided
               approval request ID.

            2. Validates that the approval request exists
               and belongs to the authenticated user's tenant.

            3. Validates that the approval request is currently
               pending and can still be acted upon.

            4. Finds the current ApprovalWorkflowLevel.

            5. Verifies that the authenticated user has the
               required role/authority to approve the current level.

            6. Creates an ApprovalAction with:
               - action = approved
               - acted_by_user_id
               - current level
               - acted_at

            7. Publishes an approval event when the request
                reaches its final approved state.

            8. Returns the updated approval request.
        */

    const membership = await this.checkMembership(input.user_id);

    const tenantId = membership.company.tenant_id;

    const company_id = membership.company_id;

    const request = await this.checkWorkflow(
      input.approvalWorkflow_id,
      tenantId,
      company_id,
    );

    if (request.status !== "PENDING") {
      throw new ConflictError("Request is no longer pending");
    }

    const currentLevel = request.current_level;

    if (!request.purchase_requisition.workflow_code) {
      throw new ConflictError("Approval request has no selected workflow");
    }

    const workflow = await this.repository.findApprovalWorkflowDefinition(
      request.purchase_requisition.workflow_code,
      tenantId,
      company_id,
    );

    if (!workflow) {
      throw new NotFoundError("Approval workflow does not exist");
    }

    const data = {
      approvalWorkflow_id: input.approvalWorkflow_id,
      tenant_id: tenantId,
      company_id: company_id,
    };

    const level = await this.repository.getCurrentLevel(
      data,
      currentLevel,
      workflow.id,
    );

    if (!level) {
      throw new NotFoundError("Level not found");
    }

    await this.checkAuthorizationRole(
      input.user_id,
      tenantId,
      membership.company_id,
      workflow.id,
      currentLevel,
    );

    const action: ApprovalActionData = {
      tenant_id: tenantId,
      approval_request_id: input.approvalWorkflow_id,
      level_id: level.id,
      acted_by_user_id: input.user_id,
      action: "APPROVED",
      remarks: null,
      acted_at: new Date(),
    };

    const approve: UpdateRequestStatusData = {
      approvalWorkflow_id: input.approvalWorkflow_id,
      purchaseRequisition_id: request.entity_id,
      tenant_id: tenantId,
      status: "APPROVED",
      current_level: currentLevel,
      resolved_at: new Date(),
      company_id,
    };

    const levels = await this.repository.getLevels(
      company_id,
      tenantId,
      workflow.id,
    );
    const nextLevel = levels.find((level) => level.level_no > currentLevel);

    if (nextLevel) {
      approve.status = "PENDING";
      approve.current_level = nextLevel.level_no;
      approve.resolved_at = null;
    }

    const approveRequest = await this.repository.recordDecision({
      action,
      request: approve,
    });

    if (!nextLevel) {
      await this.eventBus.publish("approvalWorkflow.approved", {
        purchaseRequisition_id: request.entity_id,
        approvalWorkflow_id: input.approvalWorkflow_id,
        tenant_id: tenantId,
        company_id,
      });
    }

    return approveRequest;
  }

  async rejectRequest(input: RejectionContext) {
    /*
            1. Finds the ApprovalRequest using the provided ID.

            2. Validates that the approval request exists
               and belongs to the authenticated user's tenant.

            3. Validates that the approval request is currently
               pending and can still be acted upon.

            4. Finds the current ApprovalWorkflowLevel.

            5. Verifies that the authenticated user has the
               required role/authority to reject the current level.

            6. Creates an ApprovalAction with:
               - action = rejected
               - acted_by_user_id
               - current level
               - remarks
               - acted_at

            7. Updates the ApprovalRequest:
               - status = rejected
               - resolved_at = now()

            8. Publishes an approval-rejected event.

            9. Returns the updated approval request.
        */

    const membership = await this.checkMembership(input.user_id);

    const tenantId = membership.company.tenant_id;

    const company_id = membership.company_id;

    const request = await this.checkWorkflow(
      input.approvalWorkflow_id,
      tenantId,
      company_id,
    );

    if (request.status !== "PENDING") {
      throw new ConflictError("Request is no longer pending");
    }

    const currentLevel = request.current_level;

    if (!request.purchase_requisition.workflow_code) {
      throw new ConflictError("Approval request has no selected workflow");
    }

    const data: ApprovalRequest = {
      approvalWorkflow_id: input.approvalWorkflow_id,
      tenant_id: tenantId,
      company_id: company_id,
    };

    const workflow = await this.repository.findApprovalWorkflowDefinition(
      request.purchase_requisition.workflow_code,
      tenantId,
      company_id,
    );

    if (!workflow) {
      throw new NotFoundError("Approval workflow does not exist");
    }

    const level = await this.repository.getCurrentLevel(
      data,
      currentLevel,
      workflow.id,
    );

    if (!level) {
      throw new NotFoundError("Level not found");
    }

    await this.checkAuthorizationRole(
      input.user_id,
      tenantId,
      membership.company_id,
      workflow.id,
      currentLevel,
    );

    const action: ApprovalActionData = {
      tenant_id: tenantId,
      approval_request_id: input.approvalWorkflow_id,
      level_id: level.id,
      acted_by_user_id: input.user_id,
      action: "REJECTED",
      remarks: input.remarks,
      acted_at: new Date(),
    };

    const reject: UpdateRequestStatusData = {
      approvalWorkflow_id: input.approvalWorkflow_id,
      purchaseRequisition_id: request.entity_id,
      tenant_id: tenantId,
      company_id: company_id,
      status: "REJECTED",
      resolved_at: new Date(),
      remarks: input.remarks,
    };

    const rejectRequest = await this.repository.recordDecision({
      action,
      request: reject,
    });

    return rejectRequest;
  }

  async cancelRequest(input: ApprovalContext) {
    /*
            Triggered directly through the Approval Workflow API.

            1. Finds the ApprovalRequest using the provided ID.

            2. Validates that the approval request exists
               and belongs to the authenticated user's tenant.

            3. Validates that the request can still be cancelled.

            4. Updates the ApprovalRequest:
               - status = cancelled
               - resolved_at = now()

            5. Creates an ApprovalAction if cancellation
               needs to be recorded as an approval action.

            6. Publishes an approval-request-cancelled event
               if other modules need to react.

            7. Returns the updated approval request.
        */

    const membership = await this.checkMembership(input.user_id);

    const tenantId = membership.company.tenant_id;

    const company_id = membership.company_id;

    const request = await this.checkWorkflow(
      input.approvalWorkflow_id,
      tenantId,
      company_id,
    );

    if (request.status !== "PENDING") {
      throw new ConflictError("Request is no longer pending");
    }

    const data: ApprovalRequest = {
      approvalWorkflow_id: input.approvalWorkflow_id,
      tenant_id: tenantId,
      company_id: company_id,
    };

    const currentLevel = request.current_level;

    if (!request.purchase_requisition.workflow_code) {
      throw new ConflictError("Approval request has no selected workflow");
    }

    const workflow = await this.repository.findApprovalWorkflowDefinition(
      request.purchase_requisition.workflow_code,
      tenantId,
      company_id,
    );

    if (!workflow) {
      throw new NotFoundError("Approval workflow does not exist");
    }

    const level = await this.repository.getCurrentLevel(
      data,
      currentLevel,
      workflow.id,
    );

    if (!level) {
      throw new NotFoundError("Level not found");
    }

    await this.checkAuthorizationRole(
      input.user_id,
      tenantId,
      membership.company_id,
      workflow.id,
      currentLevel,
    );

    const action: ApprovalActionData = {
      tenant_id: tenantId,
      approval_request_id: input.approvalWorkflow_id,
      level_id: level.id,
      acted_by_user_id: input.user_id,
      action: "CANCELLED",
      remarks: null,
      acted_at: new Date(),
    };

    const cancel: UpdateRequestStatusData = {
      approvalWorkflow_id: input.approvalWorkflow_id,
      tenant_id: tenantId,
      company_id: company_id,
      status: "CANCELLED",
      resolved_at: new Date(),
    };

    const cancelRequest = await this.repository.recordDecision({
      action,
      request: cancel,
    });

    return cancelRequest;
  }

  async getApprovalWorkflows(input: AuthenticatedUser) {
    /*
            1. Uses the authenticated user ID to determine
               the user's tenant/company context.

            2. Applies the optional status filter.

            3. Sends a query request to the repository for
               approval requests belonging to the user's
               authorized tenant/company.

            4. If this endpoint represents an approver's
               dashboard, filters the requests according to
               the user's approval authority/current workflow level.

            5. Structures the returned data.

            6. Returns the approval requests.
        */

    const { userId } = input;

    const membership = await this.checkMembership(userId);

    const tenantId = membership.company.tenant_id;

    const companyId = membership.company_id;

    const query: GetData = {
      tenant_id: tenantId,
      company_id: companyId,
      status: input.status,
      approver_user_id: userId,
    };

    const workflowRequests =
      await this.repository.findApprovalWorkflowRequests(query);

    return workflowRequests;
  }

  async countApprovalWorkflows(input: AuthenticatedUser) {
    const membership = await this.checkMembership(input.userId);
    return this.repository.countApprovalWorkflowRequests({
      tenant_id: membership.company.tenant_id,
      company_id: membership.company_id,
      status: input.status,
      approver_user_id: input.userId,
    });
  }

  async approvalRequest(input: AuthenticatedUser) {
    /*
            1. Uses the authenticated user to determine the
               user's tenant/company context.

            2. Finds the requested ApprovalRequest.

            3. Validates that the request belongs to the
               authenticated user's authorized tenant/company.

            4. Retrieves the related workflow, current level,
               and approval actions when needed.

            5. Structures the returned data.

            6. Returns the approval request details.
        */

    const { userId, approvalWorkflowId } = input;

    if (!approvalWorkflowId) {
      throw new Error("Approval workflow ID is required");
    }

    const membership = await this.checkMembership(userId);

    const tenantId = membership.company.tenant_id;

    const company_id = membership.company_id;

    const query: ApprovalRequest = {
      approvalWorkflow_id: approvalWorkflowId,
      tenant_id: tenantId,
      company_id: company_id,
    };

    const approvalRequest = await this.repository.getApprovalRequestById(query);

    if (!approvalRequest) {
      throw new NotFoundError("Approval request not found");
    }

    return approvalRequest;
  }

  async createLevel(input: CreateLevels) {
    /*
            [x]1. Uses the authenticated user to determine
               which tenant/company the level belongs to.

            [x]2. Validates that the referenced ApprovalWorkflow
               exists and belongs to the user's tenant/company.

            [x]3. Validates that the role referenced by roleCode
               exists and belongs to the appropriate tenant.

            [x]4. Validates the level configuration:
               - level number is valid
               - amount range is valid
               - min amount does not exceed max amount
               - level number is not duplicated

            [x]5. Optionally validates that the amount range does
               not conflict with another level in the workflow.

            [x]6. Structures the received data into an object.

            [x]7. Passes the write request to the repository.

            [x]8. Returns the created workflow level.
        */
    const {
      workflowCode,
      levelNo,
      roleCode,
      minAmount,
      maxAmount,
      isRequired,
      userId,
    } = input;

    const membership = await this.checkMembership(userId);

    const tenantId = membership.company.tenant_id;
    const companyId = membership.company_id;

    const workflow = await this.repository.findApprovalWorkflowDefinition(
      workflowCode,
      membership.company.tenant_id,
      companyId,
    );

    if (!workflow) {
      throw new NotFoundError("Approval workflow does not exist");
    }

    const role = await this.repository.findRoleByCodeAndTenant(
      roleCode,
      tenantId,
      companyId,
    );

    if (!role) {
      throw new NotFoundError("Approval role does not exist");
    }

    if (!Number.isInteger(levelNo) || levelNo < 1) {
      throw new ValidationError("Level number must be a positive integer");
    }

    if (minAmount < 0 || maxAmount < 0) {
      throw new ValidationError("Amount values cannot be negative");
    }

    if (minAmount > maxAmount) {
      throw new ValidationError("Minimum amount cannot exceed maximum amount");
    }

    // level duplicate validation

    const exisitingLevel = await this.repository.findLevelByWorkflowAndNumber(
      workflow.id,
      levelNo,
    );

    if (exisitingLevel) {
      throw new ConflictError("Workflow level already exists");
    }

    const conflictingLevel = await this.repository.findOverlappingLevel(
      workflow.id,
      membership.company.tenant_id,
      minAmount,
      maxAmount,
    );

    if (conflictingLevel) {
      throw new ConflictError(
        `Amount range conflicts with workflow level ${conflictingLevel.level_no}`,
      );
    }

    const levelData: ApprovalLevelData = {
      tenant_id: tenantId,
      company_id: companyId,
      workflow_id: workflow.id,
      level_no: levelNo,
      role_id: role.id,
      min_amount: new Decimal(minAmount),
      max_amount: new Decimal(maxAmount),
      is_required: isRequired,
    };

    const createdLevel = await this.repository.createLevelOfApproval(levelData);

    return createdLevel;
  }

  async createWorkflowDefinition(input: CreateWorkflow) {
    /*
            []1. Uses the authenticated user to determine
               which tenant/company the workflow belongs to.

            []2. Validates that the authenticated user has
               permission to configure approval workflows.

            []3. Validates the workflow configuration.

            []4. Validates that the workflow code is not already
               used by the tenant.

            []5. Sets system-controlled fields:
               - tenant_id
               - company_id
               - is_system = false
               - is_active = true

            []6. Structures the received data into an object.

            []7. Passes the write request to the repository.

            [] 8. Returns the created workflow.
        */

    const { workflowCode, name, description, entityType, userId } = input;

    // 1. determine tenant / company exist
    const membership = await this.checkMembership(userId);

    const tenantId = membership.company.tenant_id;
    const companyId = membership.company_id;

    // 2. Authorization
    // TODO: validate that this user has permission

    // to configure approval workflows.

    // 3. Validate configuration
    if (!workflowCode.trim()) {
      throw new ValidationError("Workflow code is required");
    }

    if (!name.trim()) {
      throw new ValidationError("Workflow name is required");
    }

    if (!entityType.trim()) {
      throw new ValidationError("Entity type is required");
    }

    // 4. revent duplicate workflow code within tenant

    const existingWorkflow =
      await this.repository.findApprovalWorkflowDefinition(
        workflowCode,
        tenantId,
      );

    if (existingWorkflow) {
      throw new ConflictError("Workflow code already exists");
    }

    // 5 + 6. Construct tenant-owned definition

    const workflowData: ApprovalWorkflowDefinitionData = {
      tenant_id: tenantId,
      company_id: companyId,
      workflow_code: workflowCode,
      name,
      description: description ?? null,
      entity_type: entityType,
      is_system: false,
      is_active: true,
    };

    // 7. Persist
    const createdWorkflow =
      await this.repository.createApprovalWorkflowDefinition(workflowData);

    // 8. Return
    return createdWorkflow;
  }

  async workflowCodes(input: AuthenticatedUser) {
    /*
            1. Uses the authenticated user to determine
               which tenant/company they belong to.

            2. Sends a query request to the repository for
               the workflow configurations belonging to
               the user's authorized tenant/company.

            3. Retrieves the workflow code, name, description,
               entity type, and active state.

            4. Structures the data received from the query.

            5. Returns the workflow configurations.
        */

    const { userId } = input;

    const membership = await this.checkMembership(userId);

    const tenantId = membership.company.tenant_id;
    const companyId = membership.company_id;

    const query: GetData = {
      tenant_id: tenantId,
      company_id: companyId,
    };

    const workflows = await this.repository.getWorkflowCodesById(query);

    return workflows;
  }
}
