const joi = require('joi');

const AppError = require('../../utils/AppError');

function formatJoiDetails(error) {
	if (!error || !Array.isArray(error.details)) return undefined;
	return error.details.map(d => d.message);
}

const provisionOrganizationSchema = joi
	.object({
		organizationName: joi
			.string()
			.trim()
			.min(1)
			.required()
			.pattern(/[a-z0-9]/i),
		adminEmail: joi
			.string()
			.trim()
			.lowercase()
			.email({ tlds: { allow: false } })
			.required(),
		domain: joi.string().trim().lowercase().allow('').default(''),
		channelName: joi.string().trim().allow('').default('mychannel'),
	})
	.required();

function validateProvisionOrganizationPayload(payload) {
	const { error, value } = provisionOrganizationSchema.validate(payload ?? {}, {
		abortEarly: false,
		stripUnknown: true,
	});

	if (error) {
		throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', formatJoiDetails(error));
	}

	return {
		organizationName: value.organizationName,
		adminEmail: value.adminEmail,
		domain: value.domain,
		channelName: value.channelName,
	};
}

function validateContainerName(containerName, allowedContainerNames) {
	const normalizedContainerName = String(containerName ?? '').trim();

	if (!normalizedContainerName) {
		throw new AppError('containerName is required', 400, 'VALIDATION_ERROR');
	}

	if (!(allowedContainerNames instanceof Set)) {
		throw new AppError('allowedContainerNames must be configured', 500, 'CONFIG_ERROR');
	}

	if (!allowedContainerNames.has(normalizedContainerName)) {
		throw new AppError(
			`Unsupported container ${normalizedContainerName}. Use one of: ${Array.from(allowedContainerNames).join(', ')}`,
			400,
			'UNSUPPORTED_CONTAINER',
		);
	}

	return normalizedContainerName;
}

function validateRunInContainerInput(containerName, command, allowedContainerNames) {
	const normalizedCommand = String(command ?? '').trim();
	const normalizedContainerName = validateContainerName(
		containerName,
		allowedContainerNames,
	);

	if (!normalizedCommand) {
		throw new AppError('command is required', 400, 'VALIDATION_ERROR');
	}

	return {
		containerName: normalizedContainerName,
		command: normalizedCommand,
	};
}

module.exports = {
	validateProvisionOrganizationPayload,
	validateRunInContainerInput,
};

