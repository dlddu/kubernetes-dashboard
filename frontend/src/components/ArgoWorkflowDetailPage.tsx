import { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WorkflowDetail } from './WorkflowDetail';

export function ArgoWorkflowDetailPage() {
  const { templateName, workflowName } = useParams<{ templateName: string; workflowName: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    if (templateName) {
      navigate(`/argo/templates/${templateName}`);
    } else {
      navigate('/argo');
    }
  };

  const handleResubmitSuccess = useCallback(
    (newWorkflowName: string) => {
      if (templateName) {
        navigate(`/argo/templates/${templateName}/workflows/${encodeURIComponent(newWorkflowName)}`);
      }
    },
    [templateName, navigate],
  );

  return (
    <WorkflowDetail
      namespace=""
      name={decodeURIComponent(workflowName ?? '')}
      onBack={handleBack}
      onResubmitSuccess={handleResubmitSuccess}
    />
  );
}
