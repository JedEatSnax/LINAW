'use strict'

const stringify = require ('json-stringify-deterministic')
const sortKeysRecursive = require ('sort-keys-recursive')
const { contract } = require ('fabric-contract-api')

class approvalWorkflowContract extends contract {
    // TODO:    
    // // createSubmission()
    // submitForApproval()
    // approveSubmission()
    // rejectSubmission()
    // requestChanges()
    // resubmitSubmission()
    // getSubmissionHistory()
    // deleteSubmission ()

    async createSubmission      (ctx, submissionId, owner, role, status, proposalType, docHash){

        // RBAC check organization (MSP id)


        // ABAC Check for a custom attribute 'abac.creator' set to 'true'
        // This attribute is baked into the user's certificate by the Fabric CA


         // 3. Dynamic ABAC: Check 'department' attribute

        // business logic

        const submission = {
            submissionId: submissionId,
            Owmer: owner,
            Role: role,
            Status: status,
            ProposalType: proposalType,
            DocHash: docHash
        }

        await ctx.stub.putState( submissionId, Buffer.from(stringify(sortKeysRecursive(submission))))
    }
    async submitForApproval     (ctx, submissionId){

        // RBAC check organization (MSP id)


        // ABAC Check for a custom attribute 'abac.creator' set to 'true'
        // This attribute is baked into the user's certificate by the Fabric CA


         // 3. Dynamic ABAC: Check 'department' attribute

        // business logic      
        
        
    }
    async approveSubmission     (ctx, submissionId, approver, remarks){

        // RBAC check organization (MSP id)


        // ABAC Check for a custom attribute 'abac.creator' set to 'true'
        // This attribute is baked into the user's certificate by the Fabric CA


         // 3. Dynamic ABAC: Check 'department' attribute

        // business logic        
    }
    async rejectSubmission      (ctx, submissionId, approver, remarks){

        // RBAC check organization (MSP id)


        // ABAC Check for a custom attribute 'abac.creator' set to 'true'
        // This attribute is baked into the user's certificate by the Fabric CA


         // 3. Dynamic ABAC: Check 'department' attribute

        // business logic        
    }
    async requestChanges        (ctx, submissionId, approver, remarks){

        // RBAC check organization (MSP id)


        // ABAC Check for a custom attribute 'abac.creator' set to 'true'
        // This attribute is baked into the user's certificate by the Fabric CA


         // 3. Dynamic ABAC: Check 'department' attribute

        // business logic        
    }
    async resubmitSubmission    (ctx, submissionId, owner, newDocuHash){

        // RBAC check organization (MSP id)


        // ABAC Check for a custom attribute 'abac.creator' set to 'true'
        // This attribute is baked into the user's certificate by the Fabric CA


         // 3. Dynamic ABAC: Check 'department' attribute

        // business logic        
    }
    async getSubmissionHistory  (ctx, submissionId){

        // RBAC check organization (MSP id)


        // ABAC Check for a custom attribute 'abac.creator' set to 'true'
        // This attribute is baked into the user's certificate by the Fabric CA


         // 3. Dynamic ABAC: Check 'department' attribute

        // business logic        
    }
    
}