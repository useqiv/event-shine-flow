import { Navigate, useLocation, useParams } from "react-router-dom";
import { isValidUUID } from "@/lib/urlHelpers";

const withSearch = (pathname: string, search: string): string =>
  search ? `${pathname}${search}` : pathname;

export const ShareContestRedirect = () => {
  const { contestKey } = useParams<{ contestKey: string }>();
  const location = useLocation();

  if (!contestKey) return <Navigate to="/" replace />;

  const targetPath = isValidUUID(contestKey) ? `/contests/${contestKey}` : `/c/${contestKey}`;
  return <Navigate to={withSearch(targetPath, location.search)} replace />;
};

export const ShareContestantRedirect = () => {
  const { contestKey, contestantSlug } = useParams<{ contestKey: string; contestantSlug: string }>();
  const location = useLocation();

  if (!contestKey || !contestantSlug) return <Navigate to="/" replace />;

  const targetPath = isValidUUID(contestKey)
    ? `/contests/${contestKey}/contestant/${contestantSlug}`
    : `/c/${contestKey}/contestant/${contestantSlug}`;

  return <Navigate to={withSearch(targetPath, location.search)} replace />;
};

export const ShareEventRedirect = () => {
  const { eventKey } = useParams<{ eventKey: string }>();
  const location = useLocation();

  if (!eventKey) return <Navigate to="/" replace />;

  const targetPath = isValidUUID(eventKey) ? `/events/${eventKey}` : `/e/${eventKey}`;
  return <Navigate to={withSearch(targetPath, location.search)} replace />;
};

export const ShareCampaignRedirect = () => {
  const { campaignKey } = useParams<{ campaignKey: string }>();
  const location = useLocation();

  if (!campaignKey) return <Navigate to="/" replace />;

  const targetPath = `/campaigns/${campaignKey}`;
  return <Navigate to={withSearch(targetPath, location.search)} replace />;
};

export const ShareFormRedirect = () => {
  const { formKey } = useParams<{ formKey: string }>();
  const location = useLocation();

  if (!formKey) return <Navigate to="/" replace />;

  const targetPath = `/f/${formKey}`;
  return <Navigate to={withSearch(targetPath, location.search)} replace />;
};
