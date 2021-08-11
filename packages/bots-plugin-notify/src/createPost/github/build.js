import utils from '../../utils';

const { ignoreMd } = utils;

const statuses = {
  success: '✅',
  pending: '🕔',
  failed: '❌',
  canceled: '🙅‍♂️',
  created: '🐣',
  running: '🏃💨',
};

export default function (message) {
  const {
    // commit,
    repository,
    // object_attributes: objectAttributes,
    user,
    build_name: buildName,
    project_name: projectName,
    build_status: buildStatus,
    build_id: buildId,
  } = message.meta;

  const status = statuses[buildStatus] || `🤷‍♀️ ${buildStatus}`;

  return `\
  \`${ignoreMd(projectName)}\`
${status} *${ignoreMd(buildName)}*
_${ignoreMd(user.name)}_
${repository.homepage}/-/jobs/${buildId}`;
}
