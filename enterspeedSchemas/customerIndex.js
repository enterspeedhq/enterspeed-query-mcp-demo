/** @type {Enterspeed.IndexSchema} */
  export default {
  triggers: function(context) {
    // A trigger that triggers on your source entity type(s) in your source group
    // See documentation for triggers here: https://docs.enterspeed.com/reference/js/index-schema/triggers
    context.triggers('crm', ['customer'])
  },
  index: {
    // All fields that should be indexed in the search index
    // See documentation for index here: https://docs.enterspeed.com/reference/js/index-schema/indexMethod
    fields: {
      // Example of a searchable field with type keyword
      firstName: { type: "keyword" },
      lastName: { type: "keyword" },
      email: { type: "keyword" },
      country: { type: "keyword" },
      segment: { type: "keyword" },
      joinedDate: { type: "date" },
      acceptsMarketing: { type: "boolean" }
    }
  },
  properties: function (sourceEntity) {
    // Example that returns all properties from the source entity to the view
    // See documentation for properties here: https://docs.enterspeed.com/reference/js/index-schema/properties
    return {
      firstName: sourceEntity.properties.firstName,
      lastName: sourceEntity.properties.lastName,
      email: sourceEntity.properties.email,
      country: sourceEntity.properties.country,
      segment: sourceEntity.properties.segment,
      joinedDate: sourceEntity.properties.joinedDate,
      acceptsMarketing: sourceEntity.properties.acceptsMarketing
    }
  }
}