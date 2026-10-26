import { ConflictError, NotFoundError } from "../../shared/errors/";
import { EventBus } from "../../shared/events/eventBus.js";
import { UserManagementRepository } from "./userManagementRepository.js";
import type {
  OrganizationRegistration,
  UpdateUserProfile,
} from "./userManagementValidator.js";

export class UserManagementService {
  constructor(
    private repository: UserManagementRepository,
    private eventBus: EventBus,
  ) {}

  // get

  async profile(userId: string, tenantId: string) {
    const user = await this.repository.findById(userId, tenantId);

    if (!user) {
      throw new NotFoundError("User Not Found");
    }

    return this.toProfileResponse(user);
  }

  // patch

  async updateProfile(
    userId: string,
    tenantId: string,
    input: UpdateUserProfile,
  ) {
    /*
            1. check for user if it existing

            2. check if it's really the user that's wanna update it's own profile

            3. structure it into an object and pass it to the repository layer

            4. return
        */

    // 1. Check if the user exists
    const isExist = await this.repository.findById(userId, tenantId);

    if (!isExist) {
      throw new NotFoundError("User Not Found");
    }

    // 2. User identity is already established through the
    // authenticated userId passed by the controller.

    // 3. Structure the update data
    const updateData = {
      userId,
      tenantId,
      ...input,
    };

    const updatedUser = await this.repository.updateProfile(updateData);

    if (!updatedUser) {
      throw new NotFoundError("User Not Found");
    }

    // 4. Return
    return this.toProfileResponse(updatedUser);
  }

  // post

  async companyRegister(
    userId: string,
    tenantId: string,
    input: OrganizationRegistration,
  ) {
    /*
            1. check user's tenant id

            2. get user's id

            3. register the company

            4. assign the user to the company membership
            using:
            - user_id
            - company_id
            - tenant_id
            - owner role

            5. return company id, name, and success
        */

    // 1. Check user's existing information
    const user = await this.repository.findById(userId, tenantId);

    if (!user) {
      throw new NotFoundError("User Not Found");
    }

    // 2. Get authenticated user's id and tenant information
    const userData = {
      userId: user.id,
      tenantId,
    };

    const registration = await this.repository.registerCompany({
      userId: userData.userId,
      tenantId: userData.tenantId,
      ...input,
    });

    if (registration.status === "duplicate") {
      throw new ConflictError(
        "User is already associated with an organization",
      );
    }

    if (registration.status === "missing_role") {
      throw new NotFoundError("Organization Admin role not found");
    }

    // Publish only after all registration writes have committed.
    await this.eventBus.publish("organization.registered", {
      companyId: registration.company.id,
      tenantId,
      userId,
    });

    // 6. Return
    return {
      companyId: registration.company.id,
      companyName: registration.company.display_name,
    };
  }

  private toProfileResponse(user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    job_title?: string | null;
    status: string;
    company_memberships?: { company: { display_name: string } }[];
  }) {
    return {
      user_id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      job_title: user.job_title ?? null,
      status: user.status,
      company_name: user.company_memberships?.[0]?.company.display_name ?? null,
    };
  }
}
