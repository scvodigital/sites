{{#if @root.data.auth ~}}
CALL _getSubscriptionParameters(
  {{{mysqlEscape @root.data.auth.email}}},
  {{{mysqlEscape (concat @root.context.metaData.bulletinCampaignName '-' @root.data.currentSite.name)}}},
  {{{mysqlEscape (concat @root.context.metaData.bulletinCampaignName '-' @root.data.currentSite.name)}}}
);
{{else}}
SET @query=false;
{{/if ~}}