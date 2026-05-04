import { Badge } from '@/components/ui/badge';
import { TruckStatus } from '@/types/truck';

interface StatusBadgeProps {
  status: TruckStatus;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const getStatusConfig = (status: TruckStatus) => {
    switch (status) {
      case 'unsold':
        return { label: 'Unsold', className: 'bg-muted text-muted-foreground' };
      case 'pending':
        return { label: 'Pending', className: 'bg-warning text-warning-foreground' };
      case 'closed':
        return { label: 'Closed', className: 'bg-success text-success-foreground' };
      case 'archived':
        return { label: 'Archived', className: 'bg-secondary text-secondary-foreground' };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  );
};
