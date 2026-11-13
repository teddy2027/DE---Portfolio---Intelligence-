import { useNavigate } from 'react-router-dom';
import { InviteDialog } from '../components/evaluation/InviteDialog';
import Hub from './Hub';

/** Deep-link target for the "Invite" task: renders the hub with the invite dialog open. */
export default function InvitePage() {
  const nav = useNavigate();
  return (<><Hub /><InviteDialog open onClose={() => nav('/evaluation')} source="tasks" /></>);
}
