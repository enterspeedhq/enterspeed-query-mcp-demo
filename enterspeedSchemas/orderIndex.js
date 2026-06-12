/** @type {Enterspeed.IndexSchema} */
  export default {
  triggers: function(context) {
    // A trigger that triggers on your source entity type(s) in your source group
    // See documentation for triggers here: https://docs.enterspeed.com/reference/js/index-schema/triggers
    context.triggers('erp', ['order'])
  },
  index: {
    // All fields that should be indexed in the search index
    // See documentation for index here: https://docs.enterspeed.com/reference/js/index-schema/indexMethod
    fields: {
      // Example of a searchable field with type keyword
      orderId: { type: "keyword" },
      customerId: { type: "keyword" },
      status: { type: "keyword" },
      orderDate: { type: "date" },
      orderTotal: { type: "float" },
      currency: { type: "keyword" },
      lineCount: { type: "integer" }
    }
  },
  properties: function (sourceEntity) {
    // Example that returns all properties from the source entity to the view
    // See documentation for properties here: https://docs.enterspeed.com/reference/js/index-schema/properties
    return {
      orderId: sourceEntity.properties.orderId,
      customerId: sourceEntity.properties.customerId,
      status: sourceEntity.properties.status,
      orderDate: sourceEntity.properties.orderDate,
      orderTotal: sourceEntity.properties.orderTotal,
      currency: sourceEntity.properties.currency,
      lineCount: sourceEntity.properties.lineCount
    }
  }
}