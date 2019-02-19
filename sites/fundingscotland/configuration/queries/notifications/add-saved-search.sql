{{#if @root.data.auth ~}}
CALL _addSubscriptionParameters(
  {{{mysqlEscape @root.data.auth.email}}},
  {{{mysqlEscape (concat @root.context.metaData.emailCampaignName '-' @root.data.currentSite.name)}}},
  {{{mysqlEscape (
    querystringify (obj)
      keywords=@root.request.params.query.keywords
      fund_status=@root.request.params.query.fund_status
      charities_only=@root.request.params.query.charities_only
      geographical_areas_funded=(sort @root.request.params.query.geographical_areas_funded)
      type_of_cost=(sort @root.request.params.query.type_of_cost)
      type_of_funding=(sort @root.request.params.query.type_of_funding)
      activities=@root.request.params.query.activities
      beneficiaries=@root.request.params.query.beneficiaries
    )
  }}},
  {{{mysqlEscape @root.request.params.query.name}}},
  {{#if @root.request.params.query.subscribe}}1{{else}}0{{/if}}
);
{{else}}
SET @query=false;
{{/if ~}}