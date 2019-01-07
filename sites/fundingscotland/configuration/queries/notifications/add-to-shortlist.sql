{{#if @root.data.auth ~}}
CALL _addSubscriptionParameter(
  {{{mysqlEscape @root.data.auth.email}}},
  {{{mysqlEscape (concat @root.context.metaData.shortlistCampaignName '-' @root.data.currentSite.name)}}},
  {{{mysqlEscape 'id'}}},
  {{{mysqlEscape @root.request.params.query.id}}},
  'Shortlist',
  NULL
);
{{else}}
SET @query=false;
{{/if ~}}