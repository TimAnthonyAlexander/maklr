import { SyndicationToggleList } from "../portals/SyndicationToggleList";

interface EstateSyndicationsTabProps {
  estateId: string;
}

export function EstateSyndicationsTab({ estateId }: EstateSyndicationsTabProps) {
  return <SyndicationToggleList estateId={estateId} />;
}
