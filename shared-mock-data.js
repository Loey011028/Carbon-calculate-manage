(function (root) {
  const STORAGE_KEY = "carbon-accounting-mock-state-v7-boundary-source-model-match";
  const FACTOR_LIBRARY_VERSION = "emission-source-required-v2-standards";
  const ACTIVITY_RECORDS_VERSION = "datasource-frequency-aligned-v1";
  const clone = (value) => JSON.parse(JSON.stringify(value));

  function todayString() {
    return new Date().toISOString().slice(0, 10);
  }

  function previousDay(dateValue) {
    if (!dateValue) return "";
    const date = new Date(`${dateValue}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().slice(0, 10);
  }

  const ScopeCodeToLabel = {
    scope1: "范围一",
    scope2: "范围二",
    scope3: "范围三"
  };

  const ScopeLabelToCode = {
    "范围一": "scope1",
    "范围二": "scope2",
    "范围三": "scope3"
  };

  const CategoryCodeToLabel = {
    stationary_combustion: "固定燃烧",
    mobile_combustion: "移动燃烧",
    process_emission: "工艺过程排放",
    fugitive_emission: "逸散排放",
    purchased_electricity: "外购电力",
    purchased_heat_steam: "外购热力/蒸汽",
    purchased_cooling: "外购制冷",
    purchased_goods_services: "类别1：购买的商品和服务",
    capital_goods: "类别2：资本品",
    fuel_energy_related_activities: "类别3：燃料和能源相关活动",
    upstream_transport_distribution: "类别4：上游运输和配送",
    waste_generated_operations: "类别5：运营产生的废弃物",
    business_travel: "类别6：商务旅行",
    employee_commuting: "类别7：员工通勤",
    upstream_leased_assets: "类别8：上游租赁资产",
    downstream_transport_distribution: "类别9：下游运输和配送",
    processing_of_sold_products: "类别10：售出产品加工",
    use_of_sold_products: "类别11：售出产品使用",
    end_of_life_treatment_sold_products: "类别12：售出产品寿命终止处理",
    downstream_leased_assets: "类别13：下游租赁资产",
    franchises: "类别14：特许经营",
    investments: "类别15：投资"
  };

  const CategoryLabelToCode = Object.fromEntries(
    Object.entries(CategoryCodeToLabel).map(([key, value]) => [value, key])
  );

  const SourceTypeCodeToLabel = {
    plant_boiler: "厂区锅炉",
    generator_set: "柴油发电机",
    industrial_kiln: "工业炉窑",
    refrigerant_leakage: "制冷剂泄漏",
    office_living_electricity: "办公与生活用电",
    production_equipment_electricity: "生产设备用电",
    purchased_steam: "外购蒸汽",
    upstream_transport: "上游运输",
    employee_commuting_ledger: "员工通勤"
  };

  const SourceTypeLabelToCode = Object.fromEntries(
    Object.entries(SourceTypeCodeToLabel).map(([key, value]) => [value, key])
  );

  const EmissionCategoryTree = [
    {
      groupCode: "energy",
      groupLabel: "能源类",
      children: [
        {
          category: "purchased_electricity",
          categoryLabel: "外购电力",
          children: [
            { sourceType: "office_living_electricity", sourceTypeLabel: "办公与生活用电" },
            { sourceType: "production_equipment_electricity", sourceTypeLabel: "生产设备用电" }
          ]
        },
        {
          category: "purchased_heat_steam",
          categoryLabel: "外购热力/蒸汽",
          children: [
            { sourceType: "purchased_steam", sourceTypeLabel: "外购蒸汽" }
          ]
        }
      ]
    },
    {
      groupCode: "combustion",
      groupLabel: "燃烧类",
      children: [
        {
          category: "stationary_combustion",
          categoryLabel: "固定燃烧",
          children: [
            { sourceType: "plant_boiler", sourceTypeLabel: "厂区锅炉" },
            { sourceType: "generator_set", sourceTypeLabel: "柴油发电机" }
          ]
        },
        {
          category: "mobile_combustion",
          categoryLabel: "移动燃烧",
          children: []
        }
      ]
    },
    {
      groupCode: "process",
      groupLabel: "工业过程类",
      children: [
        {
          category: "process_emission",
          categoryLabel: "工艺过程排放",
          children: []
        }
      ]
    },
    {
      groupCode: "transport",
      groupLabel: "运输类",
      children: [
        {
          category: "upstream_transport_distribution",
          categoryLabel: "类别4：上游运输和配送",
          children: [
            { sourceType: "upstream_transport", sourceTypeLabel: "上游运输" }
          ]
        },
        {
          category: "employee_commuting",
          categoryLabel: "类别7：员工通勤",
          children: [
            { sourceType: "employee_commuting_ledger", sourceTypeLabel: "员工通勤台账" }
          ]
        }
      ]
    },
    {
      groupCode: "other_direct",
      groupLabel: "其他直接排放",
      children: [
        {
          category: "fugitive_emission",
          categoryLabel: "逸散排放",
          children: [
            { sourceType: "refrigerant_leakage", sourceTypeLabel: "制冷剂泄漏" }
          ]
        }
      ]
    },
    {
      groupCode: "raw_material",
      groupLabel: "原辅材料类",
      children: [
        {
          category: "purchased_goods_services",
          categoryLabel: "类别1：购买的商品和服务",
          children: []
        },
        {
          category: "capital_goods",
          categoryLabel: "类别2：资本货物",
          children: []
        },
        {
          category: "packaging_materials",
          categoryLabel: "包装材料",
          children: []
        }
      ]
    },
    {
      groupCode: "waste",
      groupLabel: "废弃物类",
      children: [
        {
          category: "waste_generated_operations",
          categoryLabel: "类别5：运营产生的废弃物",
          children: []
        }
      ]
    },
    {
      groupCode: "travel",
      groupLabel: "差旅类",
      children: [
        {
          category: "business_travel",
          categoryLabel: "类别6：商务差旅",
          children: []
        }
      ]
    },
    {
      groupCode: "assets_leasing",
      groupLabel: "资产与租赁类",
      children: [
        {
          category: "upstream_leased_assets",
          categoryLabel: "类别8：上游租赁资产",
          children: []
        },
        {
          category: "downstream_leased_assets",
          categoryLabel: "类别13：下游租赁资产",
          children: []
        }
      ]
    },
    {
      groupCode: "product_lifecycle",
      groupLabel: "产品生命周期类",
      children: [
        {
          category: "use_of_sold_products",
          categoryLabel: "类别11：售出产品的使用",
          children: []
        },
        {
          category: "end_of_life_treatment_sold_products",
          categoryLabel: "类别12：售出产品的最终处理",
          children: []
        }
      ]
    },
    {
      groupCode: "water",
      groupLabel: "水资源类",
      children: [
        {
          category: "water_consumption",
          categoryLabel: "用水消耗",
          children: []
        },
        {
          category: "wastewater_treatment",
          categoryLabel: "废水处理",
          children: []
        }
      ]
    }
  ];

  const BoundaryScopeMeta = {
    scope1: {
      scope: "范围一",
      label: "范围一（直接排放）",
      shortLabel: "范围一",
      treeLabel: "范围一 (直接排放)",
      categoryStatus: "启用"
    },
    scope2: {
      scope: "范围二",
      label: "范围二（能源间接排放）",
      shortLabel: "范围二",
      treeLabel: "范围二 (能源间接排放)",
      categoryStatus: "启用"
    },
    scope3: {
      scope: "范围三",
      label: "范围三（其他间接排放）",
      shortLabel: "范围三",
      treeLabel: "范围三 (其他间接排放)",
      categoryStatus: "部分启用"
    }
  };

  /**
   * 这里是 source / boundary 共用的左侧树二级结构。
   * 只放当前数据源已经能闭环的类别，不把范围一、范围二全部铺满。
   */
  const BoundaryCategoryTree = {
    scope1: [
      { category: "固定燃烧", status: "启用", description: "已有锅炉房天然气表、柴油加注手工台账，可归类到固定燃烧排放源。" },
      { category: "逸散排放", status: "待完善", description: "已有 R410A 充注记录，可归类为制冷剂泄漏。" }
    ],
    scope2: [
      { category: "外购电力", status: "启用", description: "已有办公楼总电表，可归类为外购电力。" }
    ],
    scope3: []
  };

  const BoundaryCategoryOptions = {
    scope1: [
      { category: "stationary_combustion", categoryLabel: "固定燃烧", description: "固定设备燃烧化石燃料产生的直接排放。" },
      { category: "mobile_combustion", categoryLabel: "移动燃烧", description: "自有或控制的移动源燃料燃烧产生的直接排放。" },
      { category: "process_emission", categoryLabel: "工艺过程排放", description: "生产工艺中的化学或物理过程产生的直接排放。" },
      { category: "fugitive_emission", categoryLabel: "逸散排放", description: "制冷剂、灭火剂等逸散或补充产生的直接排放。" }
    ],
    scope2: [
      { category: "purchased_electricity", categoryLabel: "外购电力", description: "企业购买并消耗的电力对应的能源间接排放。" },
      { category: "purchased_heat_steam", categoryLabel: "外购热力/蒸汽", description: "企业购买并消耗的热力、热水或蒸汽对应的能源间接排放。" },
      { category: "purchased_cooling", categoryLabel: "外购制冷", description: "企业购买并消耗的冷量或集中制冷对应的能源间接排放。" }
    ],
    scope3: [
      { category: "purchased_goods_services", categoryLabel: "类别1：购买的商品和服务", description: "报告企业购买或取得的商品、服务在上游生产阶段产生的排放。" },
      { category: "capital_goods", categoryLabel: "类别2：资本品", description: "报告企业购买或取得的固定资产、设备、建筑等资本品在生产阶段产生的排放。" },
      { category: "fuel_energy_related_activities", categoryLabel: "类别3：燃料和能源相关活动", description: "已购燃料和能源在开采、生产、输配等环节产生且未纳入范围一、二的排放。" },
      { category: "upstream_transport_distribution", categoryLabel: "类别4：上游运输和配送", description: "供应商到企业边界前的第三方运输、仓储和配送活动产生的排放。" },
      { category: "waste_generated_operations", categoryLabel: "类别5：运营产生的废弃物", description: "报告企业运营过程中产生的废弃物在第三方处理、处置阶段产生的排放。" },
      { category: "business_travel", categoryLabel: "类别6：商务旅行", description: "员工因商务出行产生的交通、住宿等相关排放。" },
      { category: "employee_commuting", categoryLabel: "类别7：员工通勤", description: "员工在住所与工作地点之间通勤产生的排放。" },
      { category: "upstream_leased_assets", categoryLabel: "类别8：上游租赁资产", description: "报告企业租入且未纳入范围一、二的资产运营产生的排放。" },
      { category: "downstream_transport_distribution", categoryLabel: "类别9：下游运输和配送", description: "产品售出后由第三方进行运输、仓储和配送产生的排放。" },
      { category: "processing_of_sold_products", categoryLabel: "类别10：售出产品加工", description: "售出中间产品由下游企业继续加工时产生的排放。" },
      { category: "use_of_sold_products", categoryLabel: "类别11：售出产品使用", description: "售出产品在客户使用阶段产生的直接和必要间接排放。" },
      { category: "end_of_life_treatment_sold_products", categoryLabel: "类别12：售出产品寿命终止处理", description: "售出产品在报废、回收、处置等寿命终止阶段产生的排放。" },
      { category: "downstream_leased_assets", categoryLabel: "类别13：下游租赁资产", description: "报告企业出租给其他组织且未纳入范围一、二的资产运营产生的排放。" },
      { category: "franchises", categoryLabel: "类别14：特许经营", description: "报告企业作为特许授权方时，特许经营活动产生且未纳入范围一、二的排放。" },
      { category: "investments", categoryLabel: "类别15：投资", description: "报告企业投资活动，包括股权、债权、项目融资等相关的范围三排放。" }
    ]
  };

  const BoundaryCategories = [
    { id: "bc-scope1-stationary-combustion", scope: "scope1", category: "stationary_combustion", categoryLabel: "固定燃烧", included: true, status: "启用", description: "已有锅炉房天然气表、柴油加注手工台账，可归类到固定燃烧排放源。" },
    { id: "bc-scope1-fugitive-emission", scope: "scope1", category: "fugitive_emission", categoryLabel: "逸散排放", included: true, status: "待完善", description: "已有 R410A 充注记录，可归类为制冷剂泄漏。" },
    { id: "bc-scope2-purchased-electricity", scope: "scope2", category: "purchased_electricity", categoryLabel: "外购电力", included: true, status: "启用", description: "已有办公楼总电表，可归类为外购电力。" }
  ];

  const DataSources = [
    { id: "ds-1", name: "办公楼总电表", type: "smart-meter", groupKey: "smart-meter", meterType: "electric", unit: "kWh", activityDataType: "electricity_consumption", org: "华东园区", frequency: "15分钟", status: "在线" },
    { id: "ds-3", name: "R410A充注记录", type: "manual", groupKey: "manual", meterType: "refrigerant", unit: "kg", activityDataType: "replenishment_amount", org: "华东园区", frequency: "每月", status: "离线" },
    { id: "ds-6", name: "锅炉房天然气表", type: "smart-meter", groupKey: "smart-meter", meterType: "gas", unit: "Nm³", activityDataType: "fuel_consumption", org: "华东园区", frequency: "15分钟", status: "在线" },
    { id: "ds-10", name: "柴油加注手工台账", type: "manual", groupKey: "manual", meterType: "fuel-ledger", unit: "L", activityDataType: "fuel_consumption", org: "西北生产基地", frequency: "每周", status: "在线" }
  ];

  const ActivityParamSchemas = {
    stationary_combustion: {
      category: "stationary_combustion",
      activityDataType: "fuel_consumption",
      activityDataTypeLabel: "燃料消耗量",
      defaultUnit: "Nm³",
      params: [{
        key: "fuelType",
        label: "燃料类型",
        allowCustom: true,
        options: [
          { value: "natural_gas", label: "天然气", unit: "Nm³" },
          { value: "diesel", label: "柴油", unit: "L" },
          { value: "gasoline", label: "汽油", unit: "L" },
          { value: "coal", label: "煤", unit: "t" },
          { value: "fuel_oil", label: "燃料油", unit: "t" },
          { value: "lpg", label: "液化石油气", unit: "kg" },
          { value: "__custom__", label: "自定义" }
        ]
      }]
    },
    mobile_combustion: {
      category: "mobile_combustion",
      activityDataType: "fuel_consumption",
      activityDataTypeLabel: "移动源燃料消耗量",
      defaultUnit: "L",
      params: [{
        key: "fuelType",
        label: "燃料类型",
        allowCustom: true,
        options: [
          { value: "gasoline", label: "汽油", unit: "L" },
          { value: "diesel", label: "柴油", unit: "L" },
          { value: "lng", label: "液化天然气", unit: "kg" },
          { value: "cng", label: "压缩天然气", unit: "Nm³" },
          { value: "aviation_kerosene", label: "航空煤油", unit: "t" },
          { value: "__custom__", label: "自定义" }
        ]
      }]
    },
    process_emission: {
      category: "process_emission",
      activityDataType: "process_material_amount",
      activityDataTypeLabel: "工艺物料用量",
      defaultUnit: "t",
      params: [{
        key: "processType",
        label: "工艺类型",
        allowCustom: true,
        options: [
          { value: "carbonate_decomposition", label: "碳酸盐分解", unit: "t" },
          { value: "cement_clinker", label: "水泥熟料生产", unit: "t" },
          { value: "lime_production", label: "石灰生产", unit: "t" },
          { value: "chemical_reaction", label: "化学反应过程", unit: "t" },
          { value: "__custom__", label: "自定义" }
        ]
      }]
    },
    fugitive_emission: {
      category: "fugitive_emission",
      activityDataType: "replenishment_amount",
      activityDataTypeLabel: "制冷剂补充量",
      defaultUnit: "kg",
      params: [{
        key: "refrigerantType",
        label: "制冷剂类型",
        allowCustom: true,
        options: [
          { value: "r410a", label: "R410A", unit: "kg" },
          { value: "r134a", label: "R134A", unit: "kg" },
          { value: "r32", label: "R32", unit: "kg" },
          { value: "r22", label: "R22", unit: "kg" },
          { value: "__custom__", label: "自定义", unit: "kg" }
        ]
      }]
    },
    purchased_electricity: {
      category: "purchased_electricity",
      activityDataType: "electricity_consumption",
      activityDataTypeLabel: "用电量",
      defaultUnit: "kWh",
      params: [{
        key: "electricityRegion",
        label: "电网区域",
        allowCustom: true,
        options: [
          { value: "east_china_grid", label: "华东电网", unit: "kWh" },
          { value: "north_china_grid", label: "华北电网", unit: "kWh" },
          { value: "south_china_grid", label: "南方电网", unit: "kWh" },
          { value: "central_china_grid", label: "华中电网", unit: "kWh" },
          { value: "northwest_china_grid", label: "西北电网", unit: "kWh" },
          { value: "northeast_china_grid", label: "东北电网", unit: "kWh" },
          { value: "national_grid", label: "全国电网", unit: "kWh" },
          { value: "__custom__", label: "自定义", unit: "kWh" }
        ]
      }]
    },
    purchased_heat_steam: {
      category: "purchased_heat_steam",
      activityDataType: "heat_steam_consumption",
      activityDataTypeLabel: "外购热力/蒸汽量",
      defaultUnit: "GJ",
      params: [{
        key: "energyType",
        label: "能源类型",
        allowCustom: true,
        options: [
          { value: "steam", label: "蒸汽", unit: "t" },
          { value: "hot_water", label: "热水", unit: "GJ" },
          { value: "heat", label: "热力", unit: "GJ" },
          { value: "__custom__", label: "自定义" }
        ]
      }]
    },
    purchased_cooling: {
      category: "purchased_cooling",
      activityDataType: "cooling_consumption",
      activityDataTypeLabel: "外购冷量",
      defaultUnit: "GJ",
      params: [{
        key: "energyType",
        label: "制冷类型",
        allowCustom: true,
        options: [
          { value: "chilled_water", label: "冷冻水", unit: "GJ" },
          { value: "district_cooling", label: "集中供冷", unit: "GJ" },
          { value: "__custom__", label: "自定义" }
        ]
      }]
    },
    purchased_goods_services: {
      category: "purchased_goods_services",
      activityDataType: "purchased_amount",
      activityDataTypeLabel: "采购量",
      defaultUnit: "t",
      params: [{
        key: "goodsType",
        label: "商品/服务类型",
        allowCustom: true,
        options: [
          { value: "raw_material", label: "原材料", unit: "t" },
          { value: "packaging_material", label: "包装材料", unit: "t" },
          { value: "office_supply", label: "办公用品", unit: "件" },
          { value: "outsourced_service", label: "外包服务", unit: "万元" },
          { value: "__custom__", label: "自定义" }
        ]
      }]
    },
    capital_goods: {
      category: "capital_goods",
      activityDataType: "capital_goods_amount",
      activityDataTypeLabel: "资本品采购量",
      defaultUnit: "万元",
      params: [{
        key: "capitalGoodsType",
        label: "资本品类型",
        allowCustom: true,
        options: [
          { value: "equipment", label: "生产设备", unit: "台" },
          { value: "building", label: "建筑物", unit: "m²" },
          { value: "vehicle", label: "车辆", unit: "辆" },
          { value: "it_asset", label: "IT资产", unit: "台" },
          { value: "__custom__", label: "自定义" }
        ]
      }]
    },
    fuel_energy_related_activities: {
      category: "fuel_energy_related_activities",
      activityDataType: "fuel_energy_amount",
      activityDataTypeLabel: "燃料和能源相关活动量",
      defaultUnit: "kWh",
      params: [{
        key: "energyType",
        label: "能源类型",
        allowCustom: true,
        options: [
          { value: "electricity_wtt", label: "电力上游", unit: "kWh" },
          { value: "natural_gas_wtt", label: "天然气上游", unit: "Nm³" },
          { value: "diesel_wtt", label: "柴油上游", unit: "L" },
          { value: "coal_wtt", label: "煤炭上游", unit: "t" },
          { value: "__custom__", label: "自定义" }
        ]
      }]
    },
    upstream_transport_distribution: {
      category: "upstream_transport_distribution",
      activityDataType: "transport_distance",
      activityDataTypeLabel: "上游运输周转量",
      defaultUnit: "t·km",
      params: [{
        key: "transportMode",
        label: "运输方式",
        allowCustom: true,
        options: [
          { value: "road_truck", label: "公路货车", unit: "t·km" },
          { value: "rail", label: "铁路", unit: "t·km" },
          { value: "waterway", label: "水运", unit: "t·km" },
          { value: "air_freight", label: "航空货运", unit: "t·km" },
          { value: "__custom__", label: "自定义" }
        ]
      }]
    },
    waste_generated_operations: {
      category: "waste_generated_operations",
      activityDataType: "waste_amount",
      activityDataTypeLabel: "废弃物产生量",
      defaultUnit: "t",
      params: [{
        key: "wasteType",
        label: "废弃物类型",
        allowCustom: true,
        options: [
          { value: "general_waste", label: "一般固废", unit: "t" },
          { value: "hazardous_waste", label: "危险废物", unit: "t" },
          { value: "recyclable_waste", label: "可回收物", unit: "t" },
          { value: "food_waste", label: "厨余垃圾", unit: "t" },
          { value: "__custom__", label: "自定义" }
        ]
      }]
    },
    business_travel: {
      category: "business_travel",
      activityDataType: "travel_distance",
      activityDataTypeLabel: "商务旅行里程",
      defaultUnit: "人·km",
      params: [{
        key: "travelMode",
        label: "出行方式",
        allowCustom: true,
        options: [
          { value: "flight_domestic", label: "国内航班", unit: "人·km" },
          { value: "flight_international", label: "国际航班", unit: "人·km" },
          { value: "rail", label: "铁路", unit: "人·km" },
          { value: "taxi", label: "出租车/网约车", unit: "km" },
          { value: "hotel_night", label: "住宿", unit: "间夜" },
          { value: "__custom__", label: "自定义" }
        ]
      }]
    },
    employee_commuting: {
      category: "employee_commuting",
      activityDataType: "commuting_distance",
      activityDataTypeLabel: "员工通勤里程",
      defaultUnit: "人·km",
      params: [{
        key: "commutingMode",
        label: "通勤方式",
        allowCustom: true,
        options: [
          { value: "private_car", label: "私家车", unit: "人·km" },
          { value: "bus", label: "公交", unit: "人·km" },
          { value: "metro", label: "地铁", unit: "人·km" },
          { value: "electric_bike", label: "电动车", unit: "人·km" },
          { value: "walking_cycling", label: "步行/骑行", unit: "人·km" },
          { value: "__custom__", label: "自定义" }
        ]
      }]
    },
    upstream_leased_assets: {
      category: "upstream_leased_assets",
      activityDataType: "leased_asset_energy",
      activityDataTypeLabel: "租入资产能源消耗量",
      defaultUnit: "kWh",
      params: [{
        key: "assetType",
        label: "租入资产类型",
        allowCustom: true,
        options: [
          { value: "leased_office", label: "租入办公室", unit: "kWh" },
          { value: "leased_warehouse", label: "租入仓库", unit: "kWh" },
          { value: "leased_equipment", label: "租入设备", unit: "kWh" },
          { value: "__custom__", label: "自定义" }
        ]
      }]
    },
    downstream_transport_distribution: {
      category: "downstream_transport_distribution",
      activityDataType: "transport_distance",
      activityDataTypeLabel: "下游运输周转量",
      defaultUnit: "t·km",
      params: [{
        key: "transportMode",
        label: "运输方式",
        allowCustom: true,
        options: [
          { value: "road_truck", label: "公路货车", unit: "t·km" },
          { value: "rail", label: "铁路", unit: "t·km" },
          { value: "waterway", label: "水运", unit: "t·km" },
          { value: "air_freight", label: "航空货运", unit: "t·km" },
          { value: "__custom__", label: "自定义" }
        ]
      }]
    },
    processing_of_sold_products: {
      category: "processing_of_sold_products",
      activityDataType: "processed_product_amount",
      activityDataTypeLabel: "售出产品加工量",
      defaultUnit: "t",
      params: [{
        key: "productType",
        label: "产品类型",
        allowCustom: true,
        options: [
          { value: "intermediate_product", label: "中间产品", unit: "t" },
          { value: "component", label: "零部件", unit: "件" },
          { value: "material", label: "材料", unit: "t" },
          { value: "__custom__", label: "自定义" }
        ]
      }]
    },
    use_of_sold_products: {
      category: "use_of_sold_products",
      activityDataType: "sold_product_use",
      activityDataTypeLabel: "售出产品使用量",
      defaultUnit: "台·年",
      params: [{
        key: "productUseType",
        label: "使用阶段类型",
        allowCustom: true,
        options: [
          { value: "energy_using_product", label: "耗能产品", unit: "台·年" },
          { value: "fuel_using_product", label: "耗燃料产品", unit: "台·年" },
          { value: "refrigerant_using_product", label: "含制冷剂产品", unit: "台·年" },
          { value: "__custom__", label: "自定义" }
        ]
      }]
    },
    end_of_life_treatment_sold_products: {
      category: "end_of_life_treatment_sold_products",
      activityDataType: "end_of_life_amount",
      activityDataTypeLabel: "寿命终止处理量",
      defaultUnit: "t",
      params: [{
        key: "treatmentType",
        label: "处理方式",
        allowCustom: true,
        options: [
          { value: "landfill", label: "填埋", unit: "t" },
          { value: "incineration", label: "焚烧", unit: "t" },
          { value: "recycling", label: "回收", unit: "t" },
          { value: "reuse", label: "再利用", unit: "t" },
          { value: "__custom__", label: "自定义" }
        ]
      }]
    },
    downstream_leased_assets: {
      category: "downstream_leased_assets",
      activityDataType: "leased_asset_energy",
      activityDataTypeLabel: "出租资产能源消耗量",
      defaultUnit: "kWh",
      params: [{
        key: "assetType",
        label: "出租资产类型",
        allowCustom: true,
        options: [
          { value: "leased_building", label: "出租建筑", unit: "kWh" },
          { value: "leased_equipment", label: "出租设备", unit: "kWh" },
          { value: "leased_vehicle", label: "出租车辆", unit: "L" },
          { value: "__custom__", label: "自定义" }
        ]
      }]
    },
    franchises: {
      category: "franchises",
      activityDataType: "franchise_energy",
      activityDataTypeLabel: "特许经营能源消耗量",
      defaultUnit: "kWh",
      params: [{
        key: "franchiseType",
        label: "特许经营类型",
        allowCustom: true,
        options: [
          { value: "retail_store", label: "零售门店", unit: "kWh" },
          { value: "service_site", label: "服务网点", unit: "kWh" },
          { value: "production_site", label: "生产网点", unit: "kWh" },
          { value: "__custom__", label: "自定义" }
        ]
      }]
    },
    investments: {
      category: "investments",
      activityDataType: "investment_amount",
      activityDataTypeLabel: "投资金额或持股活动量",
      defaultUnit: "万元",
      params: [{
        key: "investmentType",
        label: "投资类型",
        allowCustom: true,
        options: [
          { value: "equity_investment", label: "股权投资", unit: "万元" },
          { value: "debt_investment", label: "债权投资", unit: "万元" },
          { value: "project_finance", label: "项目融资", unit: "万元" },
          { value: "managed_asset", label: "受托管理资产", unit: "万元" },
          { value: "__custom__", label: "自定义" }
        ]
      }]
    }
  };

  function mergeActivityParamOptions(baseOptions = [], customOptions = []) {
    const result = clone(baseOptions || []);

    (customOptions || []).forEach((option) => {
      if (!option || !option.value) return;
      const index = result.findIndex((item) => item.value === option.value);

      if (index >= 0) {
        result[index] = {
          ...result[index],
          ...option
        };
      } else {
        result.push(option);
      }
    });

    return result;
  }

  function mergeActivityParams(baseParams = [], customParams = []) {
    const result = clone(baseParams || []);

    (customParams || []).forEach((param) => {
      if (!param || !param.key) return;
      const index = result.findIndex((item) => item.key === param.key);

      if (index >= 0) {
        result[index] = {
          ...result[index],
          ...param,
          options: mergeActivityParamOptions(result[index].options || [], param.options || [])
        };
      } else {
        result.push(param);
      }
    });

    return result;
  }

  function mergeActivityParamSchemas(baseSchemas = {}, customSchemas = {}) {
    const merged = clone(baseSchemas || {});

    Object.entries(customSchemas || {}).forEach(([category, schema]) => {
      if (!category || !schema) return;
      const base = merged[category] || {};

      merged[category] = {
        ...base,
        ...schema,
        category,
        params: mergeActivityParams(base.params || [], schema.params || []),
        custom: schema.custom === true || base.custom === true
      };
    });

    return merged;
  }

  const ActivityDataRecords = [
    { id: "adr-1", datasourceId: "ds-1", sourceId: "es-office-building-electricity", period: "2026-06-29 10:15-10:30", amount: 42.6, unit: "kWh", quality: "通过", collectedAt: "2026-06-29 10:30", status: "已入库" },
    { id: "adr-2", datasourceId: "ds-1", sourceId: "es-office-building-electricity", period: "2026-06-29 10:00-10:15", amount: 39.8, unit: "kWh", quality: "通过", collectedAt: "2026-06-29 10:15", status: "已入库" },
    { id: "adr-3", datasourceId: "ds-1", sourceId: "es-office-building-electricity", period: "2026-06-29 09:45-10:00", amount: 37.2, unit: "kWh", quality: "通过", collectedAt: "2026-06-29 10:00", status: "已入库" },
    { id: "adr-4", datasourceId: "ds-3", sourceId: "es-refrigerant-r410a", period: "2026-06", amount: 18.5, unit: "kg", quality: "待复核", collectedAt: "2026-06-28 18:00", status: "待确认" },
    { id: "adr-5", datasourceId: "ds-3", sourceId: "es-refrigerant-r410a", period: "2026-05", amount: 12, unit: "kg", quality: "通过", collectedAt: "2026-05-31 18:00", status: "已入库" },
    { id: "adr-6", datasourceId: "ds-6", sourceId: "es-natural-gas-boiler-1", period: "2026-06-29 10:12-10:27", amount: 18.4, unit: "Nm³", quality: "通过", collectedAt: "2026-06-29 10:27", status: "已入库" },
    { id: "adr-7", datasourceId: "ds-6", sourceId: "es-natural-gas-boiler-1", period: "2026-06-29 09:57-10:12", amount: 17.9, unit: "Nm³", quality: "通过", collectedAt: "2026-06-29 10:12", status: "已入库" },
    { id: "adr-10", datasourceId: "ds-6", sourceId: "es-natural-gas-boiler-1", period: "2026-06-29 09:42-09:57", amount: 18.1, unit: "Nm³", quality: "通过", collectedAt: "2026-06-29 09:57", status: "已入库" },
    { id: "adr-8", datasourceId: "ds-10", sourceId: "es-emergency-diesel-generator", period: "2026-W26", amount: 320, unit: "L", quality: "通过", collectedAt: "2026-06-29 09:20", status: "已入库" },
    { id: "adr-9", datasourceId: "ds-10", sourceId: "es-emergency-diesel-generator", period: "2026-W25", amount: 280, unit: "L", quality: "通过", collectedAt: "2026-06-22 09:20", status: "已入库" }
  ];

  const EmissionSources = [
    { id: "es-office-building-electricity", name: "办公楼用电", scope: "scope2", category: "purchased_electricity", sourceType: "office_living_electricity", activityDataType: "electricity_consumption", unit: "kWh", accountingParams: { electricityRegion: "east_china_grid" }, datasourceIds: ["ds-1"], status: "启用", org: "华东园区", equipment: "—" },
    { id: "es-refrigerant-r410a", name: "中央空调R410A补充", scope: "scope1", category: "fugitive_emission", sourceType: "refrigerant_leakage", activityDataType: "replenishment_amount", unit: "kg", accountingParams: { refrigerantType: "r410a" }, datasourceIds: ["ds-3"], status: "待完善", org: "华东园区", equipment: "12台" },
    { id: "es-natural-gas-boiler-1", name: "1号天然气锅炉", scope: "scope1", category: "stationary_combustion", sourceType: "plant_boiler", activityDataType: "fuel_consumption", unit: "Nm³", accountingParams: { fuelType: "natural_gas" }, datasourceIds: ["ds-6"], status: "启用", org: "华东园区", equipment: "1台" },
    { id: "es-emergency-diesel-generator", name: "应急柴油发电机", scope: "scope1", category: "stationary_combustion", sourceType: "generator_set", activityDataType: "fuel_consumption", unit: "L", accountingParams: { fuelType: "diesel" }, datasourceIds: ["ds-10"], status: "启用", org: "西北生产基地", equipment: "1台" }
  ];

  const AccountingModels = [
  {
    id: "am-stationary-combustion",
    name: "固定燃烧核算模型",
    scope: "scope1",
    category: "stationary_combustion",
    categoryCode: "stationary_combustion",
    categoryLabel: "固定燃烧",
    activityDataType: "fuel_consumption",
    standardId: "std-ndrc-accounting-guideline",
    standard: "企业温室气体排放核算方法与报告指南",
    method: "排放因子法",
    formula: "CO2e = 活动数据 × 按燃料类型匹配的固定燃烧因子组",
    periodStart: "2024-01",
    periodEnd: "",
    matchRule: {
      scope: "scope1",
      categoryCode: "stationary_combustion",
      periodField: "period",
      periodStart: "2024-01",
      periodEnd: "",
      description: "排放源推导范围为范围一，排放类别为固定燃烧，且活动数据期间在模型有效期内时匹配。"
    },
    factorMatchRule: {
      standardId: "std-ndrc-accounting-guideline",
      activityDataType: "fuel_consumption",
      fields: ["categoryCode", "standardId", "fuelType"]
    },
    version: "v1.0.0",
    status: "启用"
  },
  {
    id: "am-purchased-electricity",
    name: "外购电力核算模型",
    scope: "scope2",
    category: "purchased_electricity",
    categoryCode: "purchased_electricity",
    categoryLabel: "外购电力",
    activityDataType: "electricity_consumption",
    standardId: "std-mee-power-2022",
    standard: "2022年度电力二氧化碳排放因子",
    method: "排放因子法",
    formula: "CO2e = 外购电力活动数据 × 按电网区域匹配的电力因子组",
    periodStart: "2024-01",
    periodEnd: "",
    matchRule: {
      scope: "scope2",
      categoryCode: "purchased_electricity",
      periodField: "period",
      periodStart: "2024-01",
      periodEnd: "",
      description: "排放源推导范围为范围二，排放类别为外购电力，且活动数据期间在模型有效期内时匹配。"
    },
    factorMatchRule: {
      standardId: "std-mee-power-2022",
      activityDataType: "electricity_consumption",
      fields: ["categoryCode", "standardId", "electricityRegion"]
    },
    version: "v1.0.0",
    status: "启用"
  },
  {
    id: "am-fugitive-emission",
    name: "逸散排放核算模型",
    scope: "scope1",
    category: "fugitive_emission",
    categoryCode: "fugitive_emission",
    categoryLabel: "逸散排放",
    activityDataType: "replenishment_amount",
    standardId: "std-ipcc-2006-ar6",
    standard: "IPCC 2006 Guidelines + AR6 GWP100",
    method: "排放因子法",
    formula: "CO2e = 制冷剂补充量 × GWP100",
    periodStart: "2024-01",
    periodEnd: "",
    matchRule: {
      scope: "scope1",
      categoryCode: "fugitive_emission",
      periodField: "period",
      periodStart: "2024-01",
      periodEnd: "",
      description: "排放源推导范围为范围一，排放类别为逸散排放，且活动数据期间在模型有效期内时匹配。"
    },
    factorMatchRule: {
      standardId: "std-ipcc-2006-ar6",
      activityDataType: "replenishment_amount",
      fields: ["categoryCode", "standardId", "refrigerantType"]
    },
    version: "v1.0.0",
    status: "启用"
  }
];

  const FactorGroups = [
    { id: "fg-natural-gas", name: "天然气锅炉燃烧因子组" },
    { id: "fg-diesel", name: "柴油发电机燃烧因子组" },
    { id: "fg-east-china-grid", name: "华东电网外购电力因子组" },
    { id: "fg-r410a", name: "R410A制冷剂泄漏因子组" }
  ];

  const FactorStandards = [
    {
      id: "std-ndrc-accounting-guideline",
      name: "企业温室气体排放核算方法与报告指南",
      code: "STD_NDRC_GHG_GUIDE",
      issuer: "国家发展改革委 / 生态环境部延续采用",
      year: "2015",
      type: "核算指南",
      referenceUrl: "https://www.ndrc.gov.cn/",
      description: "用于固定燃烧活动数据、低位发热量、单位热值含碳量、碳氧化率等参数口径。",
      status: "启用"
    },
    {
      id: "std-mee-power-2022",
      name: "2022年度电力二氧化碳排放因子",
      code: "STD_MEE_POWER_2022",
      issuer: "生态环境部 / 国家统计局",
      year: "2024",
      type: "电力因子",
      referenceUrl: "https://www.mee.gov.cn/",
      description: "用于外购电力位置基准法核算；默认采用全国电力平均二氧化碳排放因子 0.5366 kgCO₂/kWh。",
      status: "启用"
    },
    {
      id: "std-ipcc-2006-ar6",
      name: "IPCC 2006 Guidelines + AR6 GWP100",
      code: "STD_IPCC_2006_AR6",
      issuer: "IPCC",
      year: "2021",
      type: "国际指南",
      referenceUrl: "https://www.ipcc.ch/",
      description: "用于制冷剂泄漏活动数据口径，并配合 AR6 GWP100 做 CO₂e 换算。",
      status: "启用"
    }
  ];

const GwpVersions = [
  {
    id: "gwp-ar6-100",
    code: "AR6",
    name: "IPCC AR6 (2021) - GWP100",
    sourceStandard: "IPCC AR6 WGI Chapter 7 / GHG Protocol GWP Values",
    reportName: "IPCC 第六次评估报告",
    horizon: "100年",
    effectiveDate: "2023-01-01",
    expireDate: "",
    enabled: true,
    status: "启用",
    description: "基于 IPCC AR6 的 GWP100 参数库。系统当前 CO₂e 换算默认使用此版本。"
  },
  {
    id: "gwp-ar5-100",
    code: "AR5",
    name: "IPCC AR5 (2014) - GWP100",
    sourceStandard: "IPCC AR5 / GHG Protocol GWP Values",
    reportName: "IPCC 第五次评估报告",
    horizon: "100年",
    effectiveDate: "2015-06-01",
    expireDate: "2022-12-31",
    enabled: false,
    status: "停用",
    description: "基于 IPCC AR5 的 GWP100 参数库。"
  },
  {
    id: "gwp-ar4-100",
    code: "AR4",
    name: "IPCC AR4 (2007) - GWP100",
    sourceStandard: "IPCC AR4 / GHG Protocol GWP Values",
    reportName: "IPCC 第四次评估报告",
    horizon: "100年",
    effectiveDate: "2008-01-01",
    expireDate: "2015-05-31",
    enabled: false,
    status: "停用",
    description: "基于 IPCC AR4 的 GWP100 参数库，常用于早期盘查或历史口径对比。"
  }
];

const GWP_GASES = [
  {
    gas: "CO₂",
    gasName: "二氧化碳",
    formula: "CO₂",
    category: "主要温室气体",
    values: { AR6: 1, AR5: 1, AR4: 1 }
  },
  {
    gas: "CH₄",
    gasName: "甲烷",
    formula: "CH₄",
    category: "主要温室气体",
    values: { AR6: 27.2, AR5: 28, AR4: 25 }
  },
  {
    gas: "N₂O",
    gasName: "一氧化二氮",
    formula: "N₂O",
    category: "主要温室气体",
    values: { AR6: 273, AR5: 265, AR4: 298 }
  },
  {
    gas: "HFC-134a",
    gasName: "HFC-134a",
    formula: "CH₂FCF₃",
    category: "制冷剂",
    values: { AR6: 1530, AR5: 1300, AR4: 1430 }
  },
  {
    gas: "R410A",
    gasName: "R410A 制冷剂",
    formula: "R410A",
    category: "制冷剂混合物",
    values: { AR6: 2256, AR5: 1924, AR4: 2088 }
  },
  {
    gas: "SF₆",
    gasName: "六氟化硫",
    formula: "SF₆",
    category: "工业气体",
    values: { AR6: 25200, AR5: 23500, AR4: 22800 }
  },
  {
    gas: "NF₃",
    gasName: "三氟化氮",
    formula: "NF₃",
    category: "工业气体",
    values: { AR6: 17400, AR5: 16100, AR4: 17200 }
  }
];
const GwpParameters = GWP_GASES.flatMap((gas) =>
  GwpVersions.map((version) => ({
    id: `gwp-param-${version.code.toLowerCase()}-${String(gas.gas).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    versionId: version.id,
    versionCode: version.code,
    versionName: version.name,
    horizon: version.horizon || "100年",
    gas: gas.gas,
    gasName: gas.gasName,
    formula: gas.formula,
    category: gas.category,
    value: gas.values[version.code],
    unit: "kgCO₂e/kg",
    sourceStandard: version.sourceStandard,
    effectiveDate: version.effectiveDate,
    expireDate: version.expireDate,
    referenceCount: gas.gas === "CO₂" ? 18 : gas.gas === "CH₄" ? 23 : gas.gas === "R410A" ? 6 : 0,
    enabled: true,
    status: "启用",
    description: `${gas.gasName} 在 ${version.name} 下的 ${version.horizon || "100年"} GWP 参数。`
  }))
);
const GwpOperationLogs = [
  {
    id: "gwp-log-1",
    time: "2026-07-07 09:30:00",
    action: "启用版本",
    content: "启用 IPCC AR6 GWP100，并自动停用其他版本",
    target: "IPCC AR6",
    version: "AR6",
    operator: "管理员",
    result: "成功",
    ip: "192.168.1.100"
  },
  {
    id: "gwp-log-2",
    time: "2026-07-07 09:10:00",
    action: "编辑因子",
    content: "修改甲烷 GWP100 参数",
    target: "甲烷",
    version: "AR6",
    operator: "管理员",
    result: "成功",
    ip: "192.168.1.100"
  },
  {
    id: "gwp-log-3",
    time: "2026-07-06 16:40:00",
    action: "版本对比",
    content: "对比 IPCC AR6 与 IPCC AR5",
    target: "GWP版本",
    version: "AR6/AR5",
    operator: "管理员",
    result: "成功",
    ip: "192.168.1.101"
  }
];
const ModelStandardRules = {
  stationary_combustion: {
    defaultStandardId: "std-ndrc-accounting-guideline",
    activityDataType: "fuel_consumption",
    factorFields: ["categoryCode", "activityDataType", "standardId", "fuelType"],
    description: "固定燃烧按燃料类型匹配因子，例如天然气、柴油。"
  },
  fugitive_emission: {
    defaultStandardId: "std-ipcc-2006-ar6",
    activityDataType: "replenishment_amount",
    factorFields: ["categoryCode", "activityDataType", "standardId", "refrigerantType"],
    description: "逸散排放按制冷剂类型匹配因子，例如 R410A。"
  },
  purchased_electricity: {
    defaultStandardId: "std-mee-power-2022",
    activityDataType: "electricity_consumption",
    factorFields: ["categoryCode", "activityDataType", "standardId", "electricityRegion"],
    description: "外购电力按电网区域或电力因子口径匹配因子。"
  },
  purchased_heat_steam: {
    defaultStandardId: "std-ndrc-accounting-guideline",
    activityDataType: "steam_consumption",
    factorFields: ["categoryCode", "activityDataType", "standardId", "energyType"],
    description: "外购热力/蒸汽按能源类型匹配因子。"
  },
  purchased_cooling: {
    defaultStandardId: "std-ndrc-accounting-guideline",
    activityDataType: "cooling_consumption",
    factorFields: ["categoryCode", "activityDataType", "standardId", "energyType"],
    description: "外购制冷按冷量或能源类型匹配因子。"
  }
};

function getModelStandardRule(categoryCode) {
  return ModelStandardRules[categoryCode] || {
    defaultStandardId: "std-ndrc-accounting-guideline",
    activityDataType: "",
    factorFields: ["categoryCode", "activityDataType", "standardId"],
    description: "通用模型匹配规则。"
  };
}

function getDefaultFactorMatchFields(categoryCode) {
  return getModelStandardRule(categoryCode).factorFields || ["categoryCode", "activityDataType", "standardId"];
}
  const FactorLibraryFactors = [
    { id: "ef-natural-gas-co2", name: "天然气锅炉燃烧CO₂因子", code: "EF_NG_BOILER_CO2", category: "固定燃烧 / 厂区锅炉 / 天然气", standardId: "std-ndrc-accounting-guideline", gwp: "AR6 (GWP100)", gases: [{ gas: "CO₂", value: "2.162", unit: "kgCO₂/Nm³" }], region: "全国", scope: "范围一", source: "企业温室气体排放核算方法与报告指南", startDate: "2024-01-01", endDate: "", status: "启用" },
    { id: "ef-natural-gas-ch4", name: "天然气锅炉燃烧CH₄因子", code: "EF_NG_BOILER_CH4", category: "固定燃烧 / 厂区锅炉 / 天然气", standardId: "std-ndrc-accounting-guideline", gwp: "AR6 (GWP100)", gases: [{ gas: "CH₄", value: "0.00012", unit: "kgCH₄/Nm³" }], region: "全国", scope: "范围一", source: "企业温室气体排放核算方法与报告指南", startDate: "2024-01-01", endDate: "", status: "启用" },
    { id: "ef-natural-gas-n2o", name: "天然气锅炉燃烧N₂O因子", code: "EF_NG_BOILER_N2O", category: "固定燃烧 / 厂区锅炉 / 天然气", standardId: "std-ndrc-accounting-guideline", gwp: "AR6 (GWP100)", gases: [{ gas: "N₂O", value: "0.00003", unit: "kgN₂O/Nm³" }], region: "全国", scope: "范围一", source: "企业温室气体排放核算方法与报告指南", startDate: "2024-01-01", endDate: "", status: "启用" },
    { id: "ef-diesel-generator-co2", name: "柴油发电机燃烧CO₂因子", code: "EF_DIESEL_GEN_CO2", category: "固定燃烧 / 柴油发电机 / 柴油", standardId: "std-ndrc-accounting-guideline", gwp: "AR6 (GWP100)", gases: [{ gas: "CO₂", value: "2.676", unit: "kgCO₂/L" }], region: "全国", scope: "范围一", source: "企业温室气体排放核算方法与报告指南", startDate: "2024-01-01", endDate: "", status: "启用" },
    { id: "ef-diesel-generator-ch4", name: "柴油发电机燃烧CH₄因子", code: "EF_DIESEL_GEN_CH4", category: "固定燃烧 / 柴油发电机 / 柴油", standardId: "std-ndrc-accounting-guideline", gwp: "AR6 (GWP100)", gases: [{ gas: "CH₄", value: "0.00013", unit: "kgCH₄/L" }], region: "全国", scope: "范围一", source: "企业温室气体排放核算方法与报告指南", startDate: "2024-01-01", endDate: "", status: "启用" },
    { id: "ef-diesel-generator-n2o", name: "柴油发电机燃烧N₂O因子", code: "EF_DIESEL_GEN_N2O", category: "固定燃烧 / 柴油发电机 / 柴油", standardId: "std-ndrc-accounting-guideline", gwp: "AR6 (GWP100)", gases: [{ gas: "N₂O", value: "0.000024", unit: "kgN₂O/L" }], region: "全国", scope: "范围一", source: "企业温室气体排放核算方法与报告指南", startDate: "2024-01-01", endDate: "", status: "启用" },
    { id: "ef-national-grid-co2", name: "华东电网外购电力CO₂因子", code: "EF_CN_GRID_2022_CO2", category: "外购电力 / 华东电网", standardId: "std-mee-power-2022", gwp: "AR6 (GWP100)", gases: [{ gas: "CO₂", value: "0.5366", unit: "kgCO₂/kWh" }], region: "华东电网", scope: "范围二", source: "2022年度电力二氧化碳排放因子", startDate: "2024-01-01", endDate: "", status: "启用" },
    { id: "ef-r410a-leakage", name: "R410A制冷剂泄漏因子", code: "EF_R410A_LEAK", category: "逸散排放 / 制冷剂泄漏 / R410A", standardId: "std-ipcc-2006-ar6", gwp: "AR6 (GWP100)", gases: [{ gas: "R410A", value: "1", unit: "kgR410A/kg" }], region: "全国", scope: "范围一", source: "IPCC 2006 Guidelines + AR6 GWP100", startDate: "2024-01-01", endDate: "", status: "启用" }
  ];

  const FactorLibraryGroups = [
    { id: "fg-natural-gas", name: "天然气锅炉燃烧因子组", code: "FG_NG_BOILER", category: "固定燃烧 / 厂区锅炉 / 天然气", standardId: "std-ndrc-accounting-guideline", gwp: "AR6 (GWP100)", gases: [{ gas: "CO₂", value: "2.162", unit: "kgCO₂/Nm³" }, { gas: "CH₄", value: "0.00012", unit: "kgCH₄/Nm³" }, { gas: "N₂O", value: "0.00003", unit: "kgN₂O/Nm³" }], region: "全国", scope: "范围一", source: "企业温室气体排放核算方法与报告指南", startDate: "2024-01-01", endDate: "", status: "启用" },
    { id: "fg-diesel", name: "柴油发电机燃烧因子组", code: "FG_DIESEL_GEN", category: "固定燃烧 / 柴油发电机 / 柴油", standardId: "std-ndrc-accounting-guideline", gwp: "AR6 (GWP100)", gases: [{ gas: "CO₂", value: "2.676", unit: "kgCO₂/L" }, { gas: "CH₄", value: "0.00013", unit: "kgCH₄/L" }, { gas: "N₂O", value: "0.000024", unit: "kgN₂O/L" }], region: "全国", scope: "范围一", source: "企业温室气体排放核算方法与报告指南", startDate: "2024-01-01", endDate: "", status: "启用" },
    { id: "fg-east-china-grid", name: "华东电网外购电力因子组", code: "FG_CN_GRID_2022", category: "外购电力 / 华东电网", standardId: "std-mee-power-2022", gwp: "AR6 (GWP100)", gases: [{ gas: "CO₂", value: "0.5366", unit: "kgCO₂/kWh" }], region: "华东电网", scope: "范围二", source: "2022年度电力二氧化碳排放因子", startDate: "2024-01-01", endDate: "", status: "启用" },
    { id: "fg-r410a", name: "R410A制冷剂泄漏因子组", code: "FG_R410A_LEAK", category: "逸散排放 / 制冷剂泄漏 / R410A", standardId: "std-ipcc-2006-ar6", gwp: "AR6 (GWP100)", gases: [{ gas: "R410A", value: "1", unit: "kgR410A/kg" }], region: "全国", scope: "范围一", source: "IPCC 2006 Guidelines + AR6 GWP100", startDate: "2024-01-01", endDate: "", status: "启用" }
  ];

  const FactorLibraryGroupMatchFields = {
    "fg-natural-gas": {
      categoryCode: "stationary_combustion",
      categoryLabel: "固定燃烧",
      activityDataType: "fuel_consumption",
      standardId: "std-ndrc-accounting-guideline",
      standardName: "企业温室气体排放核算方法与报告指南",
      fuelType: "natural_gas",
      factorIds: ["ef-natural-gas-co2", "ef-natural-gas-ch4", "ef-natural-gas-n2o"],
      effectiveDate: "2024-01-01",
      expireDate: ""
    },
    "fg-diesel": {
      categoryCode: "stationary_combustion",
      categoryLabel: "固定燃烧",
      activityDataType: "fuel_consumption",
      standardId: "std-ndrc-accounting-guideline",
      standardName: "企业温室气体排放核算方法与报告指南",
      fuelType: "diesel",
      factorIds: ["ef-diesel-generator-co2", "ef-diesel-generator-ch4", "ef-diesel-generator-n2o"],
      effectiveDate: "2024-01-01",
      expireDate: ""
    },
    "fg-east-china-grid": {
      categoryCode: "purchased_electricity",
      categoryLabel: "外购电力",
      activityDataType: "electricity_consumption",
      standardId: "std-mee-power-2022",
      standardName: "2022年度电力二氧化碳排放因子",
      electricityRegion: "east_china_grid",
      factorIds: ["ef-national-grid-co2"],
      effectiveDate: "2024-01-01",
      expireDate: ""
    },
    "fg-r410a": {
      categoryCode: "fugitive_emission",
      categoryLabel: "逸散排放",
      activityDataType: "replenishment_amount",
      standardId: "std-ipcc-2006-ar6",
      standardName: "IPCC 2006 Guidelines + AR6 GWP100",
      refrigerantType: "r410a",
      factorIds: ["ef-r410a-leakage"],
      effectiveDate: "2024-01-01",
      expireDate: ""
    }
  };

  const FactorLibraryFactorMatchFields = {
    "ef-natural-gas-co2": FactorLibraryGroupMatchFields["fg-natural-gas"],
    "ef-natural-gas-ch4": FactorLibraryGroupMatchFields["fg-natural-gas"],
    "ef-natural-gas-n2o": FactorLibraryGroupMatchFields["fg-natural-gas"],
    "ef-ng-co2": FactorLibraryGroupMatchFields["fg-natural-gas"],
    "ef-ng-ch4": FactorLibraryGroupMatchFields["fg-natural-gas"],
    "ef-ng-n2o": FactorLibraryGroupMatchFields["fg-natural-gas"],
    "ef-diesel-generator-co2": FactorLibraryGroupMatchFields["fg-diesel"],
    "ef-diesel-generator-ch4": FactorLibraryGroupMatchFields["fg-diesel"],
    "ef-diesel-generator-n2o": FactorLibraryGroupMatchFields["fg-diesel"],
    "ef-diesel-co2": FactorLibraryGroupMatchFields["fg-diesel"],
    "ef-diesel-ch4": FactorLibraryGroupMatchFields["fg-diesel"],
    "ef-diesel-n2o": FactorLibraryGroupMatchFields["fg-diesel"],
    "ef-national-grid-co2": FactorLibraryGroupMatchFields["fg-east-china-grid"],
    "ef-east-grid-co2": FactorLibraryGroupMatchFields["fg-east-china-grid"],
    "ef-r410a-leakage": FactorLibraryGroupMatchFields["fg-r410a"]
  };

  function getFactorVersionStatus(item = {}, today = todayString()) {
    if (item.status === "停用" || item.status === "鍋滅敤" || item.status === "閸嬫粎鏁?") return "停用";

    const start = item.effectiveDate || item.startDate || "";
    const end = item.expireDate || item.endDate || "";

    if (start && start > today) return "待生效";
    if (end && end < today) return "历史版本";
    return "当前版本";
  }

  function isEnabledItem(item = {}) {
    return item.status !== "停用" && item.status !== "鍋滅敤" && item.status !== "閸嬫粎鏁?";
  }

  function getStandardName(standardId, fallback = "") {
    const standard = (api?.FactorStandards || FactorStandards || []).find((item) => item.id === standardId);
    return standard?.name || fallback || "";
  }

  function normalizeFactorLibraryGroup(group = {}) {
    const matchFields = FactorLibraryGroupMatchFields[group.id] || {};
    const versionId = group.gwpVersionId || inferGwpVersionId(group.gwp || group.gwpVersion || "AR6");
    const versionCode = group.gwpVersionCode || inferGwpVersionCode(group.gwp || group.gwpVersion || "AR6");
    return {
      ...group,
      ...matchFields,
      categoryCode: group.categoryCode || matchFields.categoryCode || "",
      standardId: group.standardId || matchFields.standardId || "",
      fuelType: group.fuelType || matchFields.fuelType || "",
      electricityRegion: group.electricityRegion || matchFields.electricityRegion || "",
      refrigerantType: group.refrigerantType || matchFields.refrigerantType || "",
      gwpVersionId: versionId,
      gwpVersionCode: versionCode,
      gwp: group.gwp || group.gwpVersion || "IPCC AR6 (2021)",
      startDate: group.startDate || matchFields.startDate || "",
      endDate: group.endDate || matchFields.endDate || ""
    };
  }

  function normalizeFactorLibraryFactor(factor = {}) {
    const matchFields = FactorLibraryFactorMatchFields[factor.id] || {};
    const versionId = factor.gwpVersionId || inferGwpVersionId(factor.gwp || factor.gwpVersion || "AR6");
    const versionCode = factor.gwpVersionCode || inferGwpVersionCode(factor.gwp || factor.gwpVersion || "AR6");

    return {
      ...factor,
      ...matchFields,
      categoryCode: factor.categoryCode || matchFields.categoryCode || factor.category || "",
      standardId: factor.standardId || matchFields.standardId || "",
      fuelType: factor.fuelType || factor.matchParams?.fuelType || matchFields.fuelType || "",
      electricityRegion: factor.electricityRegion || factor.matchParams?.electricityRegion || matchFields.electricityRegion || "",
      refrigerantType: factor.refrigerantType || factor.matchParams?.refrigerantType || matchFields.refrigerantType || "",
      gwpVersionId: versionId,
      gwpVersionCode: versionCode,
      gwp: factor.gwp || factor.gwpVersion || getGwpVersionByRef({ gwpVersionId: versionId })?.name || "IPCC AR6 (2021)",
      startDate: factor.startDate || "",
      endDate: factor.endDate || "",
      gases: factor.gases?.length
        ? factor.gases
        : [{
            gas: factor.gas || factor.formula || "CO₂",
            value: factor.value || factor.factorValue || "0",
            unit: factor.unit || factor.factorUnit || "",
            gwpVersionId: factor.gwpVersionId || versionId
          }]
    };
  }

  const BoundaryOfficialDefinitions = Object.fromEntries(
    Object.entries(BoundaryCategoryOptions).map(([scope, categories]) => [
      scope,
      categories.map(({ categoryLabel, description }) => ({ category: categoryLabel, description }))
    ])
  );

  function normalizeDatasourceId(id) {
    const text = String(id || "");
    return text.startsWith("ds-") ? text : `ds-${text}`;
  }

  function normalizeDataSource(datasource = {}) {
    const { period, ...rest } = datasource;
    return rest;
  }

  function stableParamPairs(params) {
    return Object.entries(params || {})
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${String(value)}`);
  }

  function normalizePeriodValue(period) {
  if (!period) return "";
  const text = String(period).trim();
  const monthMatch = text.match(/\d{4}-\d{2}/);
  if (monthMatch) return monthMatch[0];

  const weekMatch = text.match(/(\d{4})-W(\d{1,2})/i);
  if (weekMatch) {
    const year = Number(weekMatch[1]);
    const week = Number(weekMatch[2]);
    const firstDay = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
    const month = String(firstDay.getUTCMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }

  return text.slice(0, 7);
}

function inferGwpVersionCode(value = "") {
  const text = String(value || "").toUpperCase();
  if (text.includes("AR6")) return "AR6";
  if (text.includes("AR5")) return "AR5";
  if (text.includes("AR4")) return "AR4";
  return "AR6";
}

function inferGwpVersionId(value = "") {
  const code = inferGwpVersionCode(value);
  const version = (api?.GwpVersions || GwpVersions || []).find((item) =>
    String(item.code || "").toUpperCase() === code &&
    String(item.horizon || "100年") === "100年"
  );
  return version?.id || "gwp-ar6-100";
}

function normalizeGasName(gas) {
  return String(gas || "")
    .toUpperCase()
    .replace(/₂/g, "2")
    .replace(/₄/g, "4")
    .replace(/₃/g, "3")
    .replace(/₆/g, "6")
    .replace(/\s+/g, "");
}

function getGwpVersionByRef(ref = {}) {
  const versionId = ref.gwpVersionId || ref.versionId || "";
  const versionCode = ref.gwpVersionCode || inferGwpVersionCode(ref.gwp || ref.gwpVersion || "");

  const versions = api?.GwpVersions || GwpVersions || [];
  return versions.find((item) => item.id === versionId)
      || versions.find((item) =>
        String(item.code || "").toUpperCase() === String(versionCode || "").toUpperCase() &&
        String(item.horizon || "100年") === String(ref.horizon || "100年")
      )
      || versions.find((item) => item.enabled || item.status === "启用")
|| null;
    }
function getGasGwp(gas, ref = {}) {
  const gasKey = normalizeGasName(gas);
  const version = getGwpVersionByRef(ref);
  const params = api?.GwpParameters || GwpParameters || [];

  const matched = params.find((item) =>
    item.versionId === version?.id &&
    String(item.horizon || "100年") === String(ref.horizon || version?.horizon || "100年") &&
    item.enabled !== false &&
    item.status !== "停用" &&
    normalizeGasName(item.gas || item.formula) === gasKey
  );

  return Number(matched?.value || 1);
}

function isModelPeriodMatched(model = {}, period = "") {
  const value = normalizePeriodValue(period || model.period || "");
  const start = normalizePeriodValue(model.periodStart || model.effectiveDate || model.effectiveAt || "");
  const end = normalizePeriodValue(model.periodEnd || model.expireDate || model.expiredAt || "");

  if (!value) return true;
  if (start && value < start) return false;
  if (end && value > end) return false;
  return true;
}

function buildMatchKey(item, period = "") {
  const categoryCode = item?.categoryCode || item?.category || "";
  const scope = item?.scope || inferScopeByCategory(categoryCode, item?.sourceType) || "";
  const periodValue = normalizePeriodValue(period || item?.period || "");

  return [scope, categoryCode, periodValue].join("|");
}

function buildCategoryMatchKey(item) {
  const categoryCode = item?.categoryCode || item?.category || "";
  const scope = item?.scope || inferScopeByCategory(categoryCode, item?.sourceType) || "";

  return [scope, categoryCode].join("|");
}

function matchModel(source, models = api.AccountingModels, period = "") {
  if (!source) return null;

  const categoryCode = source.categoryCode || source.category || "";
  const inferredScope = source.scope || inferScopeByCategory(categoryCode, source.sourceType) || "";
  const periodValue = period || source.period || "";

  return (
    models.find((model) => {
      if (!model || model.status === "停用") return false;

      const modelCategory = model.categoryCode || model.category || "";
      const modelScope = model.scope || inferScopeByCategory(modelCategory, model.sourceType) || "";

      return (
        modelScope === inferredScope &&
        modelCategory === categoryCode &&
        isModelPeriodMatched(model, periodValue)
      );
    }) ||
    null
  );
}

  function matchFactor(sourceOrModel, factors = api.EmissionFactors || api.FactorLibraryGroups) {
    const model = sourceOrModel?.factorMatchRule || sourceOrModel?.factorGroupId
      ? sourceOrModel
      : matchModel(sourceOrModel, api.CalculationModels || api.AccountingModels);
    const source = sourceOrModel?.factorMatchRule || sourceOrModel?.factorGroupId
      ? {}
      : sourceOrModel;

    return matchFactorByModelAndSource(model, source, "", factors);
  }

  function getActivityAmount(activityData) {
    if (typeof activityData === "number") return activityData;
    if (!activityData || typeof activityData !== "object") return 0;

    return Number(
      activityData.amount ??
      activityData.activityAmount ??
      activityData.value ??
      activityData.quantity ??
      0
    ) || 0;
  }

  function calculateEmission(source, activityData = {}) {
  const periodValue = activityData?.period || source?.period || "";
  const model = matchModel(source, api.CalculationModels || api.AccountingModels, periodValue);
  const factorSet = matchFactorSetByModelAndSource(model, source, periodValue);
  const amount = getActivityAmount(activityData);

  if (!source || !model || !factorSet || !amount) {
    let unmatchedReason = "";

    if (!source) unmatchedReason = "缺少排放源";
    else if (!model) unmatchedReason = "未匹配到核算模型";
    else if (!factorSet) unmatchedReason = "未匹配到排放因子";
    else if (!amount) unmatchedReason = "缺少活动数据 AD";

    return {
      sourceId: source?.id || "",
      sourceName: source?.name || "",

      scope: source?.scope || model?.scope || "",
      scopeLabel: api.toScopeLabel?.(source?.scope || model?.scope) || source?.scope || model?.scope || "",
      categoryCode: source?.categoryCode || source?.category || model?.categoryCode || model?.category || "",
      categoryLabel: api.toCategoryLabel?.(source?.categoryCode || source?.category || model?.categoryCode || model?.category) || "",

      activityRecordId: activityData?.id || "",
      activityPeriod: periodValue,
      activityAmount: amount,
      activityUnit: activityData?.unit || source?.unit || "",

      model,
      modelId: model?.id || "",
      modelName: model?.name || "",
      modelCode: model?.code || "",
      modelVersion: model?.version || model?.versionNo || "",
      modelStandardId: model?.standardId || "",
      modelStandardName: api.getFactorStandard?.(model?.standardId)?.name || model?.standardName || "",

      factorSet,
      factor: factorSet,
      factorId: factorSet?.id || "",
      factorName: factorSet?.name || "",
      factorCode: factorSet?.code || "",
      factorType: factorSet?.factorType || "",
      factorVersion: factorSet?.version || factorSet?.versionNo || "",
      factorStandardId: factorSet?.standardId || model?.standardId || "",
      factorStandardName: api.getFactorStandard?.(factorSet?.standardId || model?.standardId)?.name || "",
      factors: factorSet?.factors || [],
      factorIds: Array.isArray(factorSet?.factors) && factorSet.factors.length
        ? factorSet.factors.map((item) => item.id)
        : [factorSet?.id].filter(Boolean),

      gwpVersionId: factorSet?.gwpVersionId || "",
      gwpVersionCode: factorSet?.gwpVersionCode || "",
      gwpVersionName: factorSet?.gwp || factorSet?.gwpVersionName || "",

      gasResults: [],
      totalKgCO2e: 0,
      totalTCO2e: 0,
      status: model && factorSet ? "no_activity_data" : "unmatched",
      unmatchedReason,
      traceText: unmatchedReason
    };
  }

  const gasResults = (factorSet.gases || []).map((gasFactor) => {
    const factorValue = Number(gasFactor.value) || 0;
    const gasAmount = amount * factorValue;

    const gwpVersionId = gasFactor.gwpVersionId || factorSet.gwpVersionId;
    const gwpVersionCode = gasFactor.gwpVersionCode || factorSet.gwpVersionCode;

    const gwp = getGasGwp(gasFactor.gas, {
      gwpVersionId,
      gwpVersionCode,
      horizon: gasFactor.horizon || "100年"
    });

    const kgCO2e = gasAmount * gwp;

    return {
      factorId: gasFactor.factorId,
      gas: gasFactor.gas,
      factorValue,
      factorUnit: gasFactor.unit,
      activityAmount: amount,
      gasAmount,
      gwpVersionId,
      gwpVersionCode,
      gwp,
      kgCO2e,
      tCO2e: kgCO2e / 1000
    };
  });

  const totalKgCO2e = gasResults.reduce((sum, item) => sum + item.kgCO2e, 0);

  return {
    sourceId: source.id,
    sourceName: source.name,

    scope: source.scope || model.scope || "",
    scopeLabel: api.toScopeLabel?.(source.scope || model.scope) || source.scope || model.scope || "",
    categoryCode: source.categoryCode || source.category || model.categoryCode || model.category || "",
    categoryLabel: api.toCategoryLabel?.(source.categoryCode || source.category || model.categoryCode || model.category) || "",

    activityRecordId: activityData?.id || "",
    activityPeriod: periodValue,
    activityAmount: amount,
    activityUnit: activityData?.unit || source.unit || "",

    model,
    modelId: model.id,
    modelName: model.name,
    modelCode: model.code || "",
    modelVersion: model.version || model.versionNo || "V1.0",
    modelStandardId: model.standardId || "",
    modelStandardName: api.getFactorStandard?.(model.standardId)?.name || model.standardName || "",

    factorSet,
    factor: factorSet,
    factorId: factorSet.id,
    factorName: factorSet.name,
    factorCode: factorSet.code || "",
    factorType: factorSet.factorType,
    factorVersion: factorSet.version || factorSet.versionNo || "V1.0",
    factorStandardId: factorSet.standardId || model.standardId || "",
    factorStandardName: api.getFactorStandard?.(factorSet.standardId || model.standardId)?.name || "",
    factors: factorSet.factors || [],
    factorIds: Array.isArray(factorSet.factors) && factorSet.factors.length
      ? factorSet.factors.map((item) => item.id)
      : [factorSet.id].filter(Boolean),

    gwpVersionId: factorSet.gwpVersionId || gasResults[0]?.gwpVersionId || "",
    gwpVersionCode: factorSet.gwpVersionCode || gasResults[0]?.gwpVersionCode || "",
    gwpVersionName: factorSet.gwp || factorSet.gwpVersionName || "",

    gasResults,
    totalKgCO2e,
    totalTCO2e: totalKgCO2e / 1000,
    status: "calculated",
    unmatchedReason: "",
    traceText: `${source.name || "排放源"} → ${model.name || "模型"} → ${factorSet.name || "因子"} → ${factorSet.gwpVersionCode || gasResults[0]?.gwpVersionCode || "GWP"}`
  };
}
 function getBoundaryClosureStatus(boundary = {}) {
  const scope = boundary.scope;
  const categoryCode = boundary.categoryCode || boundary.category;

  const relatedSources = (api.EmissionSources || []).filter((source) => {
    const sourceCategory = source.categoryCode || source.category;
    return (
      source.status !== "已归档" &&
      source.status !== "已删除" &&
      (!scope || source.scope === scope) &&
      (!categoryCode || sourceCategory === categoryCode)
    );
  });

  const rows = relatedSources.map((source) => {
   const activityRecord =
  (typeof api.getLatestActivityRecordBySource === "function"
    ? api.getLatestActivityRecordBySource(source)
    : null) ||
  (api.ActivityDataRecords || []).find((record) =>
    String(record.sourceId || "") === String(source.id || "")
  );

    const period = activityRecord?.period || source.period || "";
    const model = api.matchModel?.(source, api.AccountingModels || [], period);
    const factor = api.matchFactorSetByModelAndSource?.(model, source, period);
    const result = api.calculateEmission?.(source, activityRecord || {
      amount: 0,
      value: 0,
      unit: source.unit || "",
      period
    });

    const hasDatasource = Array.isArray(source.datasourceIds) && source.datasourceIds.length > 0;
    const hasActivity = Boolean(activityRecord);
    const hasModel = Boolean(model);
    const hasFactor = Boolean(factor);
    const hasGwp =
      Boolean(result?.gasResults?.length) &&
      result.gasResults.every((item) => Number(item.gwp) > 0);

    let stage = "已完成闭环";
    let status = "closed";
    let reason = "";

    if (!hasDatasource) {
      stage = "数据源绑定";
      status = "open";
      reason = "已添加边界分类，但尚未绑定排放源数据源";
    } else if (!hasActivity) {
      stage = "活动数据";
      status = "open";
      reason = "已绑定数据源，但暂无活动数据记录";
    } else if (!hasModel) {
      stage = "核算模型";
      status = "open";
      reason = "已绑定排放源，但尚未匹配核算模型";
    } else if (!hasFactor) {
      stage = "排放因子";
      status = "open";
      reason = "已匹配模型，但尚未匹配排放因子";
    } else if (!hasGwp) {
      stage = "GWP";
      status = "open";
      reason = "已匹配因子，但未匹配到对应气体 GWP";
    }

    return {
      sourceId: source.id,
      sourceName: source.name,
      hasDatasource,
      hasActivity,
      hasModel,
      hasFactor,
      hasGwp,
      modelId: model?.id || "",
      modelName: model?.name || "",
      factorId: factor?.id || "",
      factorName: factor?.name || "",
      stage,
      status,
      reason,
      calculated: result?.status === "calculated",
      totalTCO2e: result?.totalTCO2e || 0
    };
  });

  const sourceTotal = rows.length;
  const closedCount = rows.filter((row) =>
    row.hasDatasource &&
    row.hasActivity &&
    row.hasModel &&
    row.hasFactor &&
    row.hasGwp
  ).length;

  let status = "empty";
  let stage = "排放源";
  let reason = "该边界分类下暂无排放源";

  if (sourceTotal > 0 && closedCount === sourceTotal) {
    status = "closed";
    stage = "已完成闭环";
    reason = "";
  } else if (sourceTotal > 0 && closedCount > 0) {
    status = "partial";
    stage = "部分闭环";
    reason = "部分排放源已完成模型、因子、GWP 匹配";
  } else if (sourceTotal > 0) {
    status = "open";
    const firstOpen = rows.find((row) => row.status !== "closed");
    stage = firstOpen?.stage || "待完善";
    reason = firstOpen?.reason || "闭环链路未完成";
  }

  return {
    boundaryId: boundary.id || "",
    scope,
    category: categoryCode,
    sourceTotal,
    datasourceBound: rows.filter((row) => row.hasDatasource).length,
    activityMatched: rows.filter((row) => row.hasActivity).length,
    modelMatched: rows.filter((row) => row.hasModel).length,
    factorMatched: rows.filter((row) => row.hasFactor).length,
    gwpMatched: rows.filter((row) => row.hasGwp).length,
    closedCount,
    closureRate: sourceTotal ? Math.round((closedCount / sourceTotal) * 100) : 0,
    status,
    stage,
    reason,
    rows
  };
}
function refreshBoundaryClosureStatuses() {
  (api.BoundaryCategories || []).forEach((boundary) => {
    const closure = getBoundaryClosureStatus(boundary);

    boundary.closureStatus = closure.status;
    boundary.closureStage = closure.stage;
    boundary.closureReason = closure.reason;
    boundary.closureRate = closure.closureRate;
    boundary.sourceTotal = closure.sourceTotal;
    boundary.closedSourceCount = closure.closedCount;

    if (boundary.status === "已归档" || boundary.included === false) {
      return;
    }

    if (closure.status === "closed") {
      boundary.status = "已闭环";
    } else if (closure.status === "partial") {
      boundary.status = "部分闭环";
    } else if (closure.status === "empty") {
      boundary.status = "待绑定排放源";
    } else {
      boundary.status = `待完善：${closure.stage}`;
    }
  });

  return api.BoundaryCategories;
}
  function buildCalculationResults(sources = api.EmissionSources) {
  const defaultActivityAmounts = {
    "es-office-building-electricity": 128600,
    "es-refrigerant-r410a": 18,
    "es-natural-gas-boiler-1": 43600,
    "es-emergency-diesel-generator": 920
  };

  return (sources || []).map((source) => {
   const activityRecord = typeof api.getLatestActivityRecordBySource === "function"
  ? api.getLatestActivityRecordBySource(source)
  : null;

    const activityData = activityRecord || {
      id: `default-activity-${source.id}`,
      sourceId: source.id,
      amount: defaultActivityAmounts[source.id] || 0,
      value: defaultActivityAmounts[source.id] || 0,
      unit: source.unit || "",
      period: source.period || api.todayString?.().slice(0, 7) || "2026-03"
    };

    const result = calculateEmission(source, activityData);

    return {
      id: `cr-${source.id}`,
      scope: source.scope,
      category: source.category,
      categoryCode: source.categoryCode || source.category,
      sourceType: source.sourceType,
      sourceId: source.id,
      sourceName: source.name,
      datasourceIds: source.datasourceIds || [],
      activityRecordId: activityData.id || "",
      activityPeriod: activityData.period || "",
      ...result
    };
  });
}

  function getFactorGroupByModel(model, groups = api.FactorGroups) {
    return model?.factorGroupId
      ? groups.find((group) => group.id === model.factorGroupId) || null
      : null;
  }

  function getDatasourceByIds(ids, datasources = api.DataSources) {
    const wantedIds = Array.isArray(ids) ? ids : [ids];
    const byId = new Map(datasources.map((datasource) => [datasource.id, datasource]));

    return wantedIds
      .map((id) => byId.get(normalizeDatasourceId(id)))
      .filter(Boolean);
  }

  function inferScopeByCategory(categoryCode, sourceTypeCode) {
    const boundaryItems = api?.BoundaryCategories || BoundaryCategories || [];
    const categoryMatched = boundaryItems.find(item =>
      item.category === categoryCode
    );

    if (categoryMatched) return categoryMatched.scope;

    const optionGroups = api?.BoundaryCategoryOptions || BoundaryCategoryOptions || {};
    for (const [scope, options] of Object.entries(optionGroups)) {
      if ((options || []).some((item) => item.category === categoryCode)) return scope;
    }

    if (getEmissionGroupByCategory(categoryCode)?.groupCode) {
      if (["stationary_combustion", "mobile_combustion", "process_emission", "fugitive_emission"].includes(categoryCode)) return "scope1";
      if (["purchased_electricity", "purchased_heat_steam", "purchased_cooling"].includes(categoryCode)) return "scope2";
      return "scope3";
    }

    return "";
  }

  function getEnabledBoundaryCategories() {
    const map = new Map();
    const boundaryItems = api?.BoundaryCategories || BoundaryCategories || [];

    boundaryItems.forEach(item => {
      if (!item.category) return;
      if (item.status === "停用") return;

      if (!map.has(item.category)) {
        map.set(item.category, {
          scope: item.scope,
          category: item.category,
          categoryLabel: item.categoryLabel || CategoryCodeToLabel[item.category] || item.category,
          included: item.included !== false,
          status: item.status || "启用"
        });
      }
    });

    return Array.from(map.values());
  }

  function getEmissionGroupByCategory(categoryCode) {
    for (const group of EmissionCategoryTree) {
      const matchedCategory = (group.children || []).find(item => item.category === categoryCode);
      if (matchedCategory) {
        return {
          groupCode: group.groupCode,
          groupLabel: group.groupLabel
        };
      }
    }
    return {
      groupCode: "",
      groupLabel: ""
    };
  }

  function getEmissionCategoryNode(categoryCode, sourceTypeCode) {
    for (const group of EmissionCategoryTree) {
      for (const category of group.children || []) {
        if (category.category !== categoryCode) continue;

        const sourceTypeNode = (category.children || []).find(item =>
          item.sourceType === sourceTypeCode
        );

        return {
          groupCode: group.groupCode,
          groupLabel: group.groupLabel,
          category: category.category,
          categoryLabel: category.categoryLabel,
          sourceType: sourceTypeNode?.sourceType || sourceTypeCode || "",
          sourceTypeLabel: sourceTypeNode?.sourceTypeLabel || ""
        };
      }
    }

    return null;
  }

  function loadSavedState() {
    try {
      return JSON.parse(root.localStorage?.getItem(STORAGE_KEY) || "{}");
    } catch (error) {
      return {};
    }
  }

  function mergeById(defaultRows, savedRows) {
    const byId = new Map(defaultRows.map((item) => [item.id, clone(item)]));

    (savedRows || []).forEach((item) => {
      byId.set(item.id, { ...(byId.get(item.id) || {}), ...item });
    });

    return Array.from(byId.values());
  }

  function resolveStandardId(model = {}) {
    if (model.standardId) return model.standardId;

    const factorGroup = model.factorGroupId
      ? FactorLibraryGroups.find((group) => group.id === model.factorGroupId)
      : null;
    if (factorGroup?.standardId) return factorGroup.standardId;

    const standardText = String(model.standard || "").trim();
    if (!standardText) return "";

    const matchedStandard = FactorStandards.find((standard) =>
      standard.id === standardText ||
      standard.name === standardText ||
      standard.code === standardText ||
      standardText.includes(standard.name) ||
      standard.name.includes(standardText)
    );

    return matchedStandard?.id || "";
  }

  function defaultFormulaForModel(model = {}) {
    const factorGroup = model.factorGroupId
      ? FactorLibraryGroups.find((group) => group.id === model.factorGroupId)
      : null;
    const categoryLabel = CategoryCodeToLabel[model.category] || model.category || "排放类别";
    const factorName = factorGroup?.name || "匹配排放因子";
    return `CO2e = ${categoryLabel}活动数据 × ${factorName}`;
  }

  function normalizeAccountingModel(model = {}) {
  const categoryCode = model.categoryCode || model.category || "";
  const inferredScope = model.scope || inferScopeByCategory(categoryCode, model.sourceType) || "";
  const rulePreset = getModelStandardRule(categoryCode);
  const standardId = model.standardId || model.factorMatchRule?.standardId || rulePreset.defaultStandardId || resolveStandardId(model);
  const standard = FactorStandards.find((item) => item.id === standardId) || null;
  const activityDataType = model.activityDataType || model.factorMatchRule?.activityDataType || rulePreset.activityDataType || "";
  const version = model.version || "v1.0.0";
  const effectiveDate = model.effectiveDate || model.effectiveAt || "2024-01-01";
  const expireDate = model.expireDate || model.expiredAt || "";
  const periodStart = model.periodStart || model.matchRule?.periodStart || String(effectiveDate).slice(0, 7);
  const periodEnd = model.periodEnd || model.matchRule?.periodEnd || String(expireDate || "").slice(0, 7);

  const factorMatchRule = {
    ...(model.factorMatchRule || {}),
    standardId,
    activityDataType,
    factorGroupId: model.factorMatchRule?.factorGroupId || model.factorGroupId || "",
    fields: Array.isArray(model.factorMatchRule?.fields) && model.factorMatchRule.fields.length
      ? model.factorMatchRule.fields
      : getDefaultFactorMatchFields(categoryCode),
    conditions: model.factorMatchRule?.conditions || model.matchConditions || {}
  };

  return {
    ...model,
    id: model.id || `am-${Date.now()}`,
    scope: inferredScope,
    category: categoryCode,
    categoryCode,
    categoryLabel: model.categoryLabel || CategoryCodeToLabel[categoryCode] || categoryCode,
    standardId,
    standard: model.standard || standard?.name || "",
    method: model.method || "排放因子法",
    activityDataType,
    formula: model.formula || defaultFormulaForModel({ ...model, category: categoryCode }),
    periodStart,
    periodEnd,
    matchRule: {
      ...(model.matchRule || {}),
      scope: inferredScope,
      categoryCode,
      periodField: "period",
      periodStart,
      periodEnd,
      description: model.matchRule?.description || "按排放源推导范围、排放类别和活动数据期间匹配模型。"
    },
    factorMatchRule,
    version,
    effectiveDate,
    expireDate,
    status: model.status || "启用",
    type: model.type || "共享模型",
    changeLog: Array.isArray(model.changeLog) && model.changeLog.length
      ? model.changeLog
      : [{
          version,
          operator: model.operator || "系统",
          date: effectiveDate,
          status: "当前版本",
          description: model.changeDescription || model.description || "初始化共享模型配置。"
        }]
  };
}

  function getEnabledBoundaryModelCategories() {
  const map = new Map();
  const boundaryItems = api?.BoundaryCategories || BoundaryCategories || [];

  boundaryItems.forEach((item) => {
    const categoryCode = item.categoryCode || item.category;
    if (!item.scope || !categoryCode) return;
    if (item.included === false || item.status === "已归档") return;

    const key = `${item.scope}|${categoryCode}`;
    if (!map.has(key)) {
      map.set(key, {
        scope: item.scope,
        category: categoryCode,
        categoryCode,
        categoryLabel: item.categoryLabel || CategoryCodeToLabel[categoryCode] || categoryCode,
        status: item.status || "待完善"
      });
    }
  });

  return Array.from(map.values());
}

  function buildModelCategoryTree() {
  const categories = getEnabledBoundaryModelCategories();
  const scopeOrder = ["scope1", "scope2", "scope3"];

  return scopeOrder.map((scope) => {
    const children = categories
      .filter((item) => item.scope === scope)
      .map(({ category, categoryCode, categoryLabel, status }) => ({
        category,
        categoryCode: categoryCode || category,
        categoryLabel,
        status
      }));

    return {
      scope,
      scopeLabel: BoundaryScopeMeta[scope]?.shortLabel || ScopeCodeToLabel[scope] || scope,
      treeLabel: BoundaryScopeMeta[scope]?.label || BoundaryScopeMeta[scope]?.treeLabel || ScopeCodeToLabel[scope] || scope,
      children
    };
  });
}

  function isPeriodInRange(period, startDate, endDate) {
    if (!period) return true;
    const value = normalizePeriodValue(period);
    const start = normalizePeriodValue(startDate);
    const end = normalizePeriodValue(endDate);
    return (!start || value >= start) && (!end || value <= end);
  }

  function getFactorMatchValue(field, model = {}, source = {}, factor = null) {
    if (!field) return "";

    if (factor) {
      return factor[field] ?? factor.accountingParams?.[field] ?? "";
    }

    if (field === "categoryCode") {
      return source.categoryCode || source.category || model.categoryCode || model.category || "";
    }

    if (field === "standardId") {
      return model.standardId || source.standardId || "";
    }

    return source.accountingParams?.[field] ?? source[field] ?? model[field] ?? "";
  }

  function matchFactorByModelAndSource(model = {}, source = {}, period = "", factorsInput = null) {
    if (!model) return null;
    const normalizedModel = normalizeAccountingModel(model);
    const rule = normalizedModel.factorMatchRule || {};
    const fields = Array.isArray(rule.fields) && rule.fields.length
      ? rule.fields
      : ["categoryCode", "standardId"];
    const factors = factorsInput || api?.FactorLibraryGroups || FactorLibraryGroups || [];
    const periodValue = period || source.period || "";

    return (
      factors.find((factor) =>
        fields.every((field) => {
          const expected = getFactorMatchValue(field, normalizedModel, source);
          const actual = getFactorMatchValue(field, normalizedModel, source, factor);
          return expected === "" || actual === "" || String(actual) === String(expected);
        }) &&
        isPeriodInRange(periodValue, factor.startDate, factor.endDate)
      ) ||
      (normalizedModel.factorGroupId
        ? factors.find((factor) => factor.id === normalizedModel.factorGroupId) || null
        : null)
    );
  }

  function matchSingleFactorsByModelAndSource(model = {}, source = {}, period = "") {
    if (!model) return [];
    const factors = api?.FactorLibraryFactors || [];
    const rule = model.factorMatchRule || {};
    const fields = Array.isArray(rule.fields) && rule.fields.length
      ? rule.fields
      : getDefaultFactorMatchFields(model.categoryCode || model.category);

    const categoryCode = source.categoryCode || source.category || model.categoryCode || model.category || "";
    const standardId = rule.standardId || model.standardId || "";
    const sourceParams = source.accountingParams || source.params || {};
    const expected = { categoryCode, standardId, ...sourceParams };

    return factors.map(normalizeFactorLibraryFactor).filter((factor) => {
      if (!factor || factor.status === "停用" || factor.status === "鍋滅敤") return false;

      const matched = fields.every((field) => {
        const expectedValue = expected[field];
        const actualValue = factor[field];

        if (field === "categoryCode") {
          return String(actualValue || factor.category || "") === String(expectedValue || "");
        }

        if (!expectedValue) return true;
        return String(actualValue || "") === String(expectedValue || "");
      });

      if (!matched) return false;

      const currentPeriod = normalizePeriodValue(period || source.period || "");
      const factorStart = normalizePeriodValue(factor.startDate || "");
      const factorEnd = normalizePeriodValue(factor.endDate || "");

      if (currentPeriod && factorStart && currentPeriod < factorStart) return false;
      if (currentPeriod && factorEnd && currentPeriod > factorEnd) return false;

      return true;
    });
  }

  function normalizeFactorPackage(factor = {}, type = "group") {
    const versionId = factor.gwpVersionId || inferGwpVersionId(factor.gwp || factor.gwpVersion || "AR6");
    const version = getGwpVersionByRef({ gwpVersionId: versionId, gwp: factor.gwp });

    return {
      ...factor,
      type,
      factorType: type === "group" ? "因子组" : "单因子",
      gwpVersionId: versionId,
      gwpVersionCode: version?.code || inferGwpVersionCode(factor.gwp || factor.gwpVersion || "AR6"),
      gwp: factor.gwp || version?.name || "IPCC AR6 (2021)",
      gases: factor.gases || []
    };
  }

  function matchFactorPackageByModelAndSource(model = {}, source = {}, period = "") {
    if (!model) return null;
    const group = matchFactorByModelAndSource(model, source, period, api?.FactorLibraryGroups || []);

    if (group) {
      return normalizeFactorPackage(group, "group");
    }

    const singles = matchSingleFactorsByModelAndSource(model, source, period);

    if (singles.length) {
      const first = singles[0];
      return {
        ...normalizeFactorPackage(first, singles.length > 1 ? "single-combo" : "single"),
        factorType: singles.length > 1 ? "单因子组合" : "单因子",
        id: singles.map((item) => item.id).join(","),
        name: singles.length === 1 ? first.name : `${first.categoryLabel || first.categoryCode || "匹配"}单因子组合`,
        code: singles.map((item) => item.code).join(","),
        gases: singles.flatMap((item) => item.gases || [])
      };
    }

    return null;
  }

  function sortActivityRecords(records = []) {
    return records.slice().sort((a, b) => {
      const collectedCompare = String(b.collectedAt || "").localeCompare(String(a.collectedAt || ""));
      if (collectedCompare) return collectedCompare;
      return String(b.period || "").localeCompare(String(a.period || ""));
    });
  }

  function getActivityParamSchema(categoryCode) {
    const schemas = api?.ActivityParamSchemas || ActivityParamSchemas;
    const schema = schemas[categoryCode];
    return schema ? clone(schema) : null;
  }

  function getActivityDataLabel(activityDataType) {
    const schemas = api?.ActivityParamSchemas || ActivityParamSchemas;
    const matchedSchema = Object.values(schemas).find(
      (schema) => schema.activityDataType === activityDataType
    );
    return matchedSchema?.activityDataTypeLabel || activityDataType || "";
  }

  function getAccountingParamLabel(key, value) {
    const schemas = api?.ActivityParamSchemas || ActivityParamSchemas;
    for (const schema of Object.values(schemas)) {
      const param = (schema.params || []).find((item) => item.key === key);
      const option = (param?.options || []).find((item) => item.value === value);
      if (option) return option.label;
    }
    return value || "";
  }

  function getSourceParamUnit(source = {}, schema = null) {
    const schemas = api?.ActivityParamSchemas || ActivityParamSchemas;
    const currentSchema = schema || schemas[source.category] || null;
    const params = source.accountingParams || {};
    for (const param of currentSchema?.params || []) {
      const option = (param.options || []).find((item) => item.value === params[param.key]);
      if (option?.unit) return option.unit;
    }
    return source.unit || "";
  }

  function makeCustomParamCode(label) {
    const trimmed = String(label || "").trim();
    const normalized = trimmed
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 48);
    if (normalized) return `custom_${normalized}`;
    const codepoints = Array.from(trimmed)
      .map((char) => `u${char.codePointAt(0).toString(16)}`)
      .join("_")
      .slice(0, 64);
    return `custom_${codepoints || Date.now()}`;
  }

  function normalizeAccountingParams(category, formValues = {}) {
    const schemas = api?.ActivityParamSchemas || ActivityParamSchemas;
    const schema = schemas[category] || null;
    const values = formValues.accountingParams || formValues || {};
    const labelsFromForm = formValues.accountingParamLabels || {};
    const accountingParams = {};
    const accountingParamLabels = {};
    let unit = formValues.unit || "";

    (schema?.params || []).forEach((param) => {
      const rawValue = values[param.key] || "";
      if (!rawValue) return;

      const selectedOption = (param.options || []).find((option) => option.value === rawValue) || null;
      const customLabel = String(
        values[`${param.key}Custom`] ||
        labelsFromForm[param.key] ||
        formValues[`${param.key}Custom`] ||
        ""
      ).trim();

      if (rawValue === "__custom__" && param.allowCustom) {
        accountingParams[param.key] = makeCustomParamCode(customLabel);
        accountingParamLabels[param.key] = customLabel || "自定义";
      } else {
        accountingParams[param.key] = rawValue;
        accountingParamLabels[param.key] = selectedOption?.label || labelsFromForm[param.key] || rawValue;
      }

      if (!unit && selectedOption?.unit) unit = selectedOption.unit;
    });

    const firstParamLabel = Object.values(accountingParamLabels)[0] || "";
    const activityDataType = schema?.activityDataType || formValues.activityDataType || "";
    const activityDataTypeLabel = schema?.activityDataTypeLabel || getActivityDataLabel(activityDataType);
    const activityDataLabel = formValues.activityDataLabel ||
      (activityDataType === "electricity_consumption" ? activityDataTypeLabel : firstParamLabel) ||
      activityDataTypeLabel ||
      "";

    return {
      activityDataType,
      activityDataTypeLabel,
      activityDataLabel,
      accountingParams,
      accountingParamLabels,
      unit
    };
  }

  function normalizeEmissionSource(source = {}) {
    const category = source.category || "";
    const { period, ...sourceWithoutPeriod } = source;
    const groupInfo = getEmissionGroupByCategory(category);
    const normalizedActivity = normalizeAccountingParams(category, {
      activityDataType: sourceWithoutPeriod.activityDataType,
      activityDataLabel: sourceWithoutPeriod.activityDataLabel,
      accountingParams: sourceWithoutPeriod.accountingParams || {},
      accountingParamLabels: sourceWithoutPeriod.accountingParamLabels || {},
      unit: sourceWithoutPeriod.unit
    });

    return {
      ...sourceWithoutPeriod,
      groupCode: sourceWithoutPeriod.groupCode || groupInfo.groupCode || "",
      groupLabel: sourceWithoutPeriod.groupLabel || groupInfo.groupLabel || "",
      scope: sourceWithoutPeriod.scope || inferScopeByCategory(category, sourceWithoutPeriod.sourceType),
      category,
      categoryCode: sourceWithoutPeriod.categoryCode || category,
      categoryLabel: sourceWithoutPeriod.categoryLabel || CategoryCodeToLabel[category] || category,
      ...normalizedActivity,
      datasourceIds: Array.from(new Set((sourceWithoutPeriod.datasourceIds || []).map(normalizeDatasourceId)))
    };
  }

  function syncActivityParamOptionsFromSource(source = {}) {
    const category = source.category || source.categoryCode || "";
    if (!category) return;

    const schemas = api?.ActivityParamSchemas || ActivityParamSchemas;
    const schema = schemas[category];
    if (!schema) return;

    (schema.params || []).forEach((param) => {
      const value = source.accountingParams?.[param.key];
      const label = source.accountingParamLabels?.[param.key];

      if (!value || !label) return;

      const exists = (param.options || []).some((option) => option.value === value);
      if (exists) return;

      api.upsertActivityParamOption(category, param.key, {
        value,
        label,
        unit: source.unit || schema.defaultUnit || "",
        custom: true
      });
    });
  }

  function formatSourceActivityConfig(source = {}) {
    const schemas = api?.ActivityParamSchemas || ActivityParamSchemas;
    const schema = schemas[source.category] || null;
    const activityLabel = getActivityDataLabel(source.activityDataType || schema?.activityDataType);
    const paramText = (schema?.params || [])
      .map((param) => source.accountingParamLabels?.[param.key] || getAccountingParamLabel(param.key, source.accountingParams?.[param.key]))
      .filter(Boolean)
      .join(" / ");
    const unit = source.unit || getSourceParamUnit(source, schema);
    return [activityLabel, paramText, unit].filter(Boolean).join(" / ") || "未配置";
  }

  function formatSourceActivityShortLabel(source = {}) {
    const params = source.accountingParams || {};
    const labels = source.accountingParamLabels || {};

    if (source.activityDataLabel) {
      return source.activityDataLabel;
    }

    const firstParamLabel = Object.values(labels).find(Boolean);
    if (firstParamLabel) return firstParamLabel;

    if (params.fuelType) {
      return getAccountingParamLabel("fuelType", params.fuelType);
    }

    if (params.refrigerantType) {
      return getAccountingParamLabel("refrigerantType", params.refrigerantType);
    }

    if (source.activityDataType === "electricity_consumption") {
      return "用电量";
    }

    if (source.activityDataType === "heat_consumption") {
      return "热力/蒸汽";
    }

    return getActivityDataLabel(source.activityDataType) || "未配置";
  }

  function boundaryKey(scope, category) {
    return `${scope || ""}|${category || ""}`;
  }

  function getBoundaryCategoryOptions(scope) {
    return clone((api?.BoundaryCategoryOptions || BoundaryCategoryOptions)[scope] || []);
  }

function isBoundaryCategoryExists(scope, category) {
  const categoryCode = CategoryLabelToCode[category] || category;

  return (api?.BoundaryCategories || BoundaryCategories || []).some((item) =>
    item.scope === scope &&
    (item.category === categoryCode || item.categoryCode === categoryCode) &&
    item.included !== false &&
    item.status !== "已归档"
  );
}

function normalizeBoundaryCategory(boundaryCategory = {}) {
  const rawCategory = boundaryCategory.categoryCode || boundaryCategory.category || "";
  const category = CategoryLabelToCode[rawCategory] || rawCategory;
  const scope = boundaryCategory.scope || inferScopeByCategory(category) || "";
  const option = getBoundaryCategoryOptions(scope).find((item) => item.category === category) || {};
  const existingStatus = boundaryCategory.status || "";

  return {
    id: boundaryCategory.id || `bc-${scope}-${category}`.replace(/[^a-zA-Z0-9_-]+/g, "-"),
    scope,
    category,
    categoryCode: category,
    categoryLabel:
      boundaryCategory.categoryLabel ||
      option.categoryLabel ||
      CategoryCodeToLabel[category] ||
      rawCategory ||
      category,
    included: boundaryCategory.included !== false,

    // 这里不要把已有“启用 / 已闭环 / 部分闭环 / 停用 / 已归档”全部覆盖掉
    status: existingStatus || "待绑定排放源",

    closureStatus: boundaryCategory.closureStatus || "",
    closureStage: boundaryCategory.closureStage || "",
    closureReason: boundaryCategory.closureReason || "",
    closureRate: Number.isFinite(Number(boundaryCategory.closureRate))
      ? Number(boundaryCategory.closureRate)
      : 0,

    description:
      boundaryCategory.description ||
      option.description ||
      "由边界管理新增的核算分类。"
  };
}

  function upsertBoundaryCategory(boundaryCategory = {}) {
    const normalized = normalizeBoundaryCategory(boundaryCategory);
    const duplicate = api.BoundaryCategories.find((item) =>
      item.id !== normalized.id &&
      item.scope === normalized.scope &&
      item.category === normalized.category &&
      item.included !== false &&
      item.status !== "停用"
    );
    if (duplicate) {
      return {
        ok: false,
        reason: "duplicated",
        message: `${BoundaryScopeMeta[normalized.scope]?.shortLabel || normalized.scope} 下已添加「${normalized.categoryLabel}」，不能重复添加。`,
        item: duplicate
      };
    }

    const index = api.BoundaryCategories.findIndex((item) => item.id === normalized.id);
    if (index >= 0) {
      api.BoundaryCategories.splice(index, 1, { ...api.BoundaryCategories[index], ...normalized });
    } else {
      api.BoundaryCategories.push(normalized);
    }
    api.saveState?.();
    return { ok: true, item: normalized };
  }

  function addCustomScope3BoundaryCategory(label, description = "") {
    const categoryLabel = String(label || "").trim();
    if (!categoryLabel) {
      return { ok: false, reason: "empty", message: "请输入范围三自定义类别名称。" };
    }
    const options = api.BoundaryCategoryOptions.scope3 || [];
    const existingOption = options.find((item) => item.categoryLabel === categoryLabel);
    if (existingOption || api.BoundaryCategories.some((item) => item.scope === "scope3" && item.categoryLabel === categoryLabel && item.status !== "停用")) {
      return { ok: false, reason: "duplicated", message: `范围三 下已添加「${categoryLabel}」，不能重复添加。` };
    }
    const category = `custom_scope3_${makeCustomParamCode(categoryLabel).replace(/^custom_/, "")}`;
    CategoryCodeToLabel[category] = categoryLabel;
    CategoryLabelToCode[categoryLabel] = category;
    api.CategoryCodeToLabel[category] = categoryLabel;
    api.CategoryLabelToCode[categoryLabel] = category;
    api.BoundaryCategoryOptions.scope3.push({ category, categoryLabel, description: description || `${categoryLabel}相关的范围三自定义间接排放类别。` });
    return api.upsertBoundaryCategory({ scope: "scope3", category, categoryLabel, description, status: "启用" });
  }

  function getBoundaryTree() {
    const scopeOrder = ["scope1", "scope2", "scope3"];
    return scopeOrder.map((scope) => {
      const categories = (api.BoundaryCategories || [])
        .filter((item) => item.scope === scope && item.included !== false && item.status !== "停用")
        .map((item) => ({
          ...item,
          sources: (api.EmissionSources || []).filter((source) =>
            source.scope === item.scope && source.category === item.category
          )
        }));
      return {
        scope,
        scopeLabel: BoundaryScopeMeta[scope]?.treeLabel || ScopeCodeToLabel[scope] || scope,
        categories
      };
    }).filter((scopeNode) => scopeNode.categories.length);
  }

function getSourceCategoryTree() {
  const sourceCategoryMap = new Map();

  (api.EmissionSources || []).forEach((source) => {
    if (!source || source.status === "已删除" || source.status === "已归档") return;

    const categoryCode = source.categoryCode || source.category || "";
    if (!categoryCode) return;

    const group = getEmissionGroupByCategory(categoryCode) || {};
    const groupCode = group.groupCode || source.groupCode || "other";
    const groupLabel = group.groupLabel || "其他";

    const key = `${groupCode}|${categoryCode}`;

    if (!sourceCategoryMap.has(key)) {
      sourceCategoryMap.set(key, {
        groupCode,
        groupLabel,
        category: categoryCode,
        categoryCode,
        categoryLabel: source.categoryLabel || CategoryCodeToLabel[categoryCode] || categoryCode,
        status: "启用",
        sources: []
      });
    }

    sourceCategoryMap.get(key).sources.push(source);
  });

  const grouped = new Map();

  Array.from(sourceCategoryMap.values()).forEach((item) => {
    if (!grouped.has(item.groupCode)) {
      grouped.set(item.groupCode, {
        groupCode: item.groupCode,
        groupLabel: item.groupLabel,
        categories: []
      });
    }

    const statuses = item.sources.map((source) => source.status || "待完善");

    item.status = statuses.includes("停用")
      ? "部分停用"
      : statuses.includes("待完善")
        ? "待完善"
        : "启用";

    grouped.get(item.groupCode).categories.push(item);
  });

  return Array.from(grouped.values());
}

  function getSourceCategoryOptionsByGroup(groupCode) {
    const group = EmissionCategoryTree.find((item) => item.groupCode === groupCode);
    return (group?.children || []).map((item) => ({
      category: item.category,
      categoryLabel: item.categoryLabel,
      alreadyInBoundary: isBoundaryCategoryExists(inferScopeByCategory(item.category), item.category)
    }));
  }
function getBoundaryCategoryOptionsForSourceForm() {
  return (api.BoundaryCategories || [])
    .filter((item) => {
      if (!item) return false;
      if (item.included === false) return false;
      if (item.status === "已归档") return false;
      return true;
    })
    .map((item) => {
      const categoryCode = item.categoryCode || item.category;
      return {
        scope: item.scope,
        scopeLabel: ScopeCodeToLabel[item.scope] || item.scope,
        category: categoryCode,
        categoryCode,
        categoryLabel: item.categoryLabel || CategoryCodeToLabel[categoryCode] || categoryCode,
        status: item.status || "待完善"
      };
    });
}
  function normalizeFactorLibraryGroup(group = {}) {
    const matchFields = FactorLibraryGroupMatchFields[group.id] || {};
    const versionId = group.gwpVersionId || inferGwpVersionId(group.gwp || group.gwpVersion || "AR6");
    const versionCode = group.gwpVersionCode || inferGwpVersionCode(group.gwp || group.gwpVersion || "AR6");
    const { gases, components, ...groupWithoutValues } = group;
    const factorIds = group.factorIds?.length ? group.factorIds : matchFields.factorIds || [];
    const categoryCode = group.categoryCode || matchFields.categoryCode || "";
    const standardId = group.standardId || matchFields.standardId || "";
    const effectiveDate = group.effectiveDate || group.startDate || matchFields.effectiveDate || matchFields.startDate || "";
    const expireDate = group.expireDate || group.endDate || matchFields.expireDate || matchFields.endDate || "";

    return {
      ...groupWithoutValues,
      categoryCode,
      categoryLabel: group.categoryLabel || matchFields.categoryLabel || CategoryCodeToLabel[categoryCode] || "",
      activityDataType: group.activityDataType || matchFields.activityDataType || "",
      standardId,
      standardName: group.standardName || matchFields.standardName || getStandardName(standardId),
      gwpVersionId: versionId,
      gwpVersionCode: versionCode,
      gwp: group.gwp || group.gwpVersion || getGwpVersionByRef({ gwpVersionId: versionId })?.name || "IPCC AR6 (2021)",
      fuelType: group.fuelType || matchFields.fuelType || "",
      electricityRegion: group.electricityRegion || matchFields.electricityRegion || "",
      refrigerantType: group.refrigerantType || matchFields.refrigerantType || "",
      factorIds,
      effectiveDate,
      expireDate,
      startDate: effectiveDate,
      endDate: expireDate,
      version: group.version || "v1.0.0",
      status: group.status || "启用",
      versionStatus: getFactorVersionStatus({ ...group, effectiveDate, expireDate })
    };
  }

  function normalizeFactorLibraryFactor(factor = {}) {
    const matchFields = FactorLibraryFactorMatchFields[factor.id] || {};
    const firstGas = factor.gases?.[0] || {};
    const { gases, components, ...factorWithoutValues } = factor;
    const versionId = factor.gwpVersionId || firstGas.gwpVersionId || inferGwpVersionId(factor.gwp || factor.gwpVersion || "AR6");
    const versionCode = factor.gwpVersionCode || firstGas.gwpVersionCode || inferGwpVersionCode(factor.gwp || factor.gwpVersion || "AR6");
    const categoryCode = factor.categoryCode || matchFields.categoryCode || factor.category || "";
    const standardId = factor.standardId || matchFields.standardId || "";
    const effectiveDate = factor.effectiveDate || factor.startDate || matchFields.effectiveDate || matchFields.startDate || "";
    const expireDate = factor.expireDate || factor.endDate || matchFields.expireDate || matchFields.endDate || "";
    const gas = factor.gas || firstGas.gas || factor.formula || "CO₂";
    const value = factor.value || factor.factorValue || firstGas.value || "0";
    const unit = factor.unit || factor.factorUnit || firstGas.unit || "";

    return {
      ...factorWithoutValues,
      categoryCode,
      categoryLabel: factor.categoryLabel || matchFields.categoryLabel || CategoryCodeToLabel[categoryCode] || "",
      activityDataType: factor.activityDataType || matchFields.activityDataType || "",
      standardId,
      standardName: factor.standardName || matchFields.standardName || getStandardName(standardId),
      gas,
      value,
      unit,
      gwpVersionId: versionId,
      gwpVersionCode: versionCode,
      gwp: factor.gwp || factor.gwpVersion || getGwpVersionByRef({ gwpVersionId: versionId })?.name || "IPCC AR6 (2021)",
      fuelType: factor.fuelType || factor.matchParams?.fuelType || matchFields.fuelType || "",
      electricityRegion: factor.electricityRegion || factor.matchParams?.electricityRegion || matchFields.electricityRegion || "",
      refrigerantType: factor.refrigerantType || factor.matchParams?.refrigerantType || matchFields.refrigerantType || "",
      effectiveDate,
      expireDate,
      startDate: effectiveDate,
      endDate: expireDate,
      version: factor.version || "v1.0.0",
      status: factor.status || "启用",
      versionStatus: getFactorVersionStatus({ ...factor, effectiveDate, expireDate })
    };
  }

  function buildFactorVersionKey(item = {}) {
    if (item.factorKey) return item.factorKey;

    const categoryCode = item.categoryCode || item.category || "";
    const activityDataType = item.activityDataType || "";
    const standardId = item.standardId || "";
    const region = item.region || "";
    const unit = item.unit || item.gases?.[0]?.unit || "";

    const matchParams = item.matchParams || {};
    const fuelType = item.fuelType || matchParams.fuelType || "";
    const electricityRegion = item.electricityRegion || matchParams.electricityRegion || "";
    const refrigerantType = item.refrigerantType || matchParams.refrigerantType || "";

    const matchValue = fuelType || electricityRegion || refrigerantType || "";

    return [
      categoryCode,
      activityDataType,
      standardId,
      matchValue,
      region,
      unit
    ].join("|");
  }

  function getFactorVersions(kind = "factor", itemOrKey = {}) {
    const list = kind === "group"
      ? (api?.FactorLibraryGroups || FactorLibraryGroups || [])
      : (api?.FactorLibraryFactors || FactorLibraryFactors || []);

    const key = typeof itemOrKey === "string"
      ? itemOrKey
      : buildFactorVersionKey(itemOrKey);

    return list
      .map(kind === "group" ? normalizeFactorLibraryGroup : normalizeFactorLibraryFactor)
      .filter((item) => buildFactorVersionKey(item) === key)
      .map((item) => ({
        ...item,
        versionStatus: getFactorVersionStatus(item)
      }))
      .sort((a, b) => {
        const ad = a.effectiveDate || a.startDate || "";
        const bd = b.effectiveDate || b.startDate || "";
        return String(bd).localeCompare(String(ad));
      });
  }

  function chooseCurrentVersion(candidates = [], period = "") {
    if (!candidates.length) return null;

    const target = period ? normalizePeriodValue(period) : todayString();

    const available = candidates
      .filter((item) => item.status !== "停用" && item.status !== "鍋滅敤" && item.status !== "閸嬫粎鏁?")
      .filter((item) => {
        const start = normalizePeriodValue(item.effectiveDate || item.startDate || "");
        const end = normalizePeriodValue(item.expireDate || item.endDate || "");
        if (start && start > target) return false;
        if (end && end < target) return false;
        return true;
      })
      .sort((a, b) =>
        String(b.effectiveDate || b.startDate || "").localeCompare(String(a.effectiveDate || a.startDate || ""))
      );

    return available[0] || null;
  }

  function createFactorNewVersion(kind = "factor", baseId = "", patch = {}) {
    const list = kind === "group"
      ? (api?.FactorLibraryGroups || FactorLibraryGroups)
      : (api?.FactorLibraryFactors || FactorLibraryFactors);

    const index = list.findIndex((item) => item.id === baseId);
    if (index < 0) return null;

    const oldItem = list[index];
    const effectiveDate = patch.effectiveDate || patch.startDate || "";
    if (!effectiveDate) {
      throw new Error("另存为新版本时必须填写生效日期");
    }

    const newItem = {
      ...oldItem,
      ...patch,
      id: `${kind}-${Date.now()}`,
      code: oldItem.code,
      factorKey: oldItem.factorKey || buildFactorVersionKey(oldItem),
      effectiveDate,
      startDate: effectiveDate,
      expireDate: patch.expireDate || patch.endDate || "",
      endDate: patch.expireDate || patch.endDate || "",
      status: "启用",
      version: patch.version || oldItem.version || "V1.0"
    };

    if (effectiveDate <= todayString() && getFactorVersionStatus(oldItem) === "当前版本") {
      oldItem.expireDate = previousDay(effectiveDate);
      oldItem.endDate = oldItem.expireDate;
    }

    list.unshift(kind === "group" ? normalizeFactorLibraryGroup(newItem) : normalizeFactorLibraryFactor(newItem));

    if (typeof persistState === "function") persistState();
    if (typeof api?.saveState === "function") api.saveState();

    return newItem;
  }

  function getFactorsByGroup(group = {}) {
    const ids = group.factorIds || [];
    return (api?.FactorLibraryFactors || FactorLibraryFactors || [])
      .map(normalizeFactorLibraryFactor)
      .filter((factor) => ids.includes(factor.id))
      .filter(isEnabledItem);
  }

  function getExpectedFactorMatchValues(model = {}, source = {}) {
    const normalizedModel = normalizeAccountingModel(model || {});
    const rule = normalizedModel.factorMatchRule || {};
    const sourceParams = source.accountingParams || source.params || {};
    return {
      categoryCode: source.categoryCode || source.category || normalizedModel.categoryCode || normalizedModel.category || "",
      activityDataType: source.activityDataType || normalizedModel.activityDataType || rule.activityDataType || "",
      standardId: rule.standardId || normalizedModel.standardId || source.standardId || "",
      unit: source.unit || "",
      ...sourceParams
    };
  }

  function isFactorCandidateMatched(candidate = {}, model = {}, source = {}, period = "") {
    if (!candidate || !isEnabledItem(candidate)) return false;
    const normalizedModel = normalizeAccountingModel(model || {});
    const rule = normalizedModel.factorMatchRule || {};
    const fields = Array.isArray(rule.fields) && rule.fields.length
      ? Array.from(new Set(["activityDataType", ...rule.fields]))
      : getDefaultFactorMatchFields(normalizedModel.categoryCode || normalizedModel.category);
    const expected = getExpectedFactorMatchValues(normalizedModel, source);

    const matched = fields.every((field) => {
      const expectedValue = expected[field];
      const actualValue = candidate[field];
      if (!expectedValue) return true;
      return String(actualValue || "") === String(expectedValue || "");
    });

    if (!matched) return false;
    if (expected.unit && candidate.unit && source.matchUnit === true && String(candidate.unit) !== String(expected.unit)) return false;

    const periodValue = period || source.period || "";
    return isPeriodInRange(periodValue, candidate.effectiveDate || candidate.startDate, candidate.expireDate || candidate.endDate);
  }

  function factorToGas(factor = {}, fallback = {}) {
    return {
      factorId: factor.id,
      gas: factor.gas,
      value: factor.value,
      unit: factor.unit,
      gwpVersionId: factor.gwpVersionId || fallback.gwpVersionId,
      gwpVersionCode: factor.gwpVersionCode || fallback.gwpVersionCode
    };
  }

  function matchFactorGroupByModelAndSource(model = {}, source = {}, period = "") {
    if (!model) return null;
    const groups = (api?.FactorLibraryGroups || FactorLibraryGroups || [])
      .map(normalizeFactorLibraryGroup)
      .filter((group) => (group.factorIds || []).length > 1);
    const matchedGroups = groups.filter((item) => isFactorCandidateMatched(item, model, source, period));
    const group = chooseCurrentVersion(matchedGroups, period || source.period || "");
    if (!group) return null;

    const factors = getFactorsByGroup(group);
    return {
      ...group,
      factorType: "因子组",
      factors,
      gases: factors.map((factor) => factorToGas(factor, group))
    };
  }

  function matchSingleFactorByModelAndSource(model = {}, source = {}, period = "") {
    if (!model) return null;
    const factors = (api?.FactorLibraryFactors || FactorLibraryFactors || [])
      .map(normalizeFactorLibraryFactor);
    const matchedFactors = factors.filter((item) => isFactorCandidateMatched(item, model, source, period));
    const factor = chooseCurrentVersion(matchedFactors, period || source.period || "");
    if (!factor) return null;

    return {
      ...factor,
      factorType: "单因子",
      factors: [factor],
      gases: [factorToGas(factor, factor)]
    };
  }

  function matchFactorSetByModelAndSource(model = {}, source = {}, period = "") {
    const group = matchFactorGroupByModelAndSource(model, source, period);
    if (group) return group;

    const single = matchSingleFactorByModelAndSource(model, source, period);
    if (single) return single;

    return null;
  }

  function matchFactorByModelAndSource(model = {}, source = {}, period = "") {
    return matchFactorSetByModelAndSource(model, source, period);
  }

  function matchSingleFactorsByModelAndSource(model = {}, source = {}, period = "") {
    const single = matchSingleFactorByModelAndSource(model, source, period);
    return single?.factors || [];
  }

  function matchFactorPackageByModelAndSource(model = {}, source = {}, period = "") {
    return matchFactorSetByModelAndSource(model, source, period);
  }

  function calculateEmission(source, activityData = {}) {
    const model = matchModel(source, api.CalculationModels || api.AccountingModels);
    const factorSet = matchFactorSetByModelAndSource(model, source, activityData?.period || "");
    const amount = getActivityAmount(activityData);

    if (!source || !model || !factorSet || !amount) {
      return {
        sourceId: source?.id || "",
        model,
        factorSet,
        factor: factorSet,
        activityAmount: amount,
        activityUnit: activityData?.unit || source?.unit || "",
        gasResults: [],
        totalKgCO2e: 0,
        totalTCO2e: 0,
        status: model && factorSet ? "no_activity_data" : "unmatched"
      };
    }

    const gasResults = (factorSet.gases || []).map((gasFactor) => {
      const factorValue = Number(gasFactor.value) || 0;
      const gasAmount = amount * factorValue;
      const gwp = getGasGwp(gasFactor.gas, {
        gwpVersionId: gasFactor.gwpVersionId || factorSet.gwpVersionId,
        gwpVersionCode: gasFactor.gwpVersionCode || factorSet.gwpVersionCode
      });
      const kgCO2e = gasAmount * gwp;

      return {
        factorId: gasFactor.factorId,
        gas: gasFactor.gas,
        factorValue,
        factorUnit: gasFactor.unit,
        activityAmount: amount,
        gasAmount,
        gwpVersionId: gasFactor.gwpVersionId || factorSet.gwpVersionId,
        gwpVersionCode: gasFactor.gwpVersionCode || factorSet.gwpVersionCode,
        gwp,
        kgCO2e,
        tCO2e: kgCO2e / 1000
      };
    });
    const totalKgCO2e = gasResults.reduce((sum, item) => sum + item.kgCO2e, 0);

    return {
      sourceId: source.id,
      sourceName: source.name,
      modelId: model.id,
      modelName: model.name,
      factorSet,
      factor: factorSet,
      factorId: factorSet.id,
      factorName: factorSet.name,
      factorType: factorSet.factorType,
      factors: factorSet.factors || [],
      activityAmount: amount,
      activityUnit: activityData?.unit || source.unit || "",
      gasResults,
      totalKgCO2e,
      totalTCO2e: totalKgCO2e / 1000,
      status: "calculated"
    };
  }

  function persistState() {
    api?.saveState?.();
  }

  function getGwpVersions() {
    return clone(api?.GwpVersions || GwpVersions || []);
  }

  function getGwpParameters(versionId = "") {
    const params = api?.GwpParameters || GwpParameters || [];
    return clone(versionId ? params.filter((item) => item.versionId === versionId) : params);
  }
function getGwpOperationLogs() {
  return clone(api?.GwpOperationLogs || GwpOperationLogs || []);
}

function addGwpOperationLog(log) {
  const list = api?.GwpOperationLogs || GwpOperationLogs;
  const item = {
    id: log.id || `gwp-log-${Date.now()}`,
    time: log.time || new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-"),
    action: log.action || "操作",
    content: log.content || "",
    target: log.target || "",
    version: log.version || "",
    operator: log.operator || "管理员",
    result: log.result || "成功",
    ip: log.ip || "192.168.1.100"
  };
  list.unshift(item);
  persistState?.();
  return clone(item);
}
  function upsertGwpVersion(version) {
    const list = api?.GwpVersions || GwpVersions;
    const index = list.findIndex((item) => item.id === version.id);
    if (index >= 0) list[index] = { ...list[index], ...version };
    else list.unshift(version);
    persistState?.();
    return version;
  }
function enableOnlyOneGwpVersion(versionId) {
  const list = api?.GwpVersions || GwpVersions;

  list.forEach((item) => {
    const enabled = String(item.id) === String(versionId);
    item.enabled = enabled;
    item.status = enabled ? "启用" : "停用";
  });

  persistState?.();
  return clone(list);
}
  function upsertGwpParameter(param) {
    const list = api?.GwpParameters || GwpParameters;
    const index = list.findIndex((item) => item.id === param.id);
    if (index >= 0) list[index] = { ...list[index], ...param };
    else list.unshift(param);
    persistState?.();
    return param;
  }

  function removeGwpVersion(id) {
    const list = api?.GwpVersions || GwpVersions;
    const index = list.findIndex((item) => item.id === id);
    if (index >= 0) list.splice(index, 1);
    persistState?.();
  }

  function removeGwpParameter(id) {
    const list = api?.GwpParameters || GwpParameters;
    const index = list.findIndex((item) => item.id === id);
    if (index >= 0) list.splice(index, 1);
    persistState?.();
  }

  const savedState = loadSavedState();
  const mergedActivityParamSchemas = mergeActivityParamSchemas(
    ActivityParamSchemas,
    savedState.ActivityParamSchemas || {}
  );
  const savedFactorLibraryIsCurrent = savedState.FactorLibraryVersion === FACTOR_LIBRARY_VERSION;
  const savedActivityRecordsIsCurrent = savedState.ActivityRecordsVersion === ACTIVITY_RECORDS_VERSION;
  const mergedBoundaryCategoryOptions = savedState.BoundaryCategoryOptions
    ? { ...clone(BoundaryCategoryOptions), ...clone(savedState.BoundaryCategoryOptions) }
    : clone(BoundaryCategoryOptions);
  const mergedBoundaryCategoryMap = new Map();
  mergeById(BoundaryCategories, savedState.BoundaryCategories)
    .map(normalizeBoundaryCategory)
    .forEach((item) => {
      const key = boundaryKey(item.scope, item.category);
      mergedBoundaryCategoryMap.set(key, { ...(mergedBoundaryCategoryMap.get(key) || {}), ...item });
    });
  const mergedBoundaryCategories = Array.from(mergedBoundaryCategoryMap.values());
  const accountingModelInBoundary = (model, boundaryItems = mergedBoundaryCategories) =>
    boundaryItems.some((boundary) =>
      boundary.scope === model.scope &&
      boundary.category === model.category &&
      boundary.included !== false &&
      boundary.status !== "停用"
    );
  const universalAccountingModelIds = new Set(AccountingModels.map((model) => model.id));
const mergedAccountingModels = mergeById(AccountingModels, savedState.AccountingModels)
  .map(normalizeAccountingModel);
   
  const mergedFactorLibraryGroups = savedFactorLibraryIsCurrent
    ? mergeById(FactorLibraryGroups, savedState.FactorLibraryGroups).map(normalizeFactorLibraryGroup).filter((group) => (group.factorIds || []).length > 1)
    : clone(FactorLibraryGroups).map(normalizeFactorLibraryGroup).filter((group) => (group.factorIds || []).length > 1);

  var api = {
    STORAGE_KEY,
    FACTOR_LIBRARY_VERSION,
    ACTIVITY_RECORDS_VERSION,
    

    BoundaryCategories: mergedBoundaryCategories,
    BoundaryCategoryOptions: mergedBoundaryCategoryOptions,
EmissionSources: Array.isArray(savedState.EmissionSources)
  ? savedState.EmissionSources.map(normalizeEmissionSource)
  : clone(EmissionSources).map(normalizeEmissionSource),
  DataSources: Array.isArray(savedState.DataSources)
  ? savedState.DataSources.map(normalizeDataSource)
  : clone(DataSources).map(normalizeDataSource),

ActivityDataRecords: savedActivityRecordsIsCurrent && Array.isArray(savedState.ActivityDataRecords)
  ? sortActivityRecords(savedState.ActivityDataRecords)
  : clone(ActivityDataRecords),
    FactorLibraryFactors: savedFactorLibraryIsCurrent ? mergeById(FactorLibraryFactors, savedState.FactorLibraryFactors).map(normalizeFactorLibraryFactor) : clone(FactorLibraryFactors).map(normalizeFactorLibraryFactor),
    FactorLibraryGroups: mergedFactorLibraryGroups,
    FactorStandards: savedFactorLibraryIsCurrent ? mergeById(FactorStandards, savedState.FactorStandards) : clone(FactorStandards),
    GwpVersions: savedFactorLibraryIsCurrent ? mergeById(GwpVersions, savedState.GwpVersions) : clone(GwpVersions),
    GwpParameters: savedFactorLibraryIsCurrent ? mergeById(GwpParameters, savedState.GwpParameters) : clone(GwpParameters),
    GwpOperationLogs: savedFactorLibraryIsCurrent
  ? mergeById(GwpOperationLogs, savedState.GwpOperationLogs)
  : clone(GwpOperationLogs),
    DefaultFactorLibraryFactors: clone(FactorLibraryFactors).map(normalizeFactorLibraryFactor),
    DefaultFactorLibraryGroups: clone(FactorLibraryGroups).map(normalizeFactorLibraryGroup).filter((group) => (group.factorIds || []).length > 1),
    DefaultFactorStandards: clone(FactorStandards),
    DefaultGwpVersions: clone(GwpVersions),
    DefaultGwpOperationLogs: clone(GwpOperationLogs),
    DefaultGwpParameters: clone(GwpParameters),

    AccountingModels: mergedAccountingModels,
FactorGroups,
BoundaryScopeMeta,
BoundaryCategoryTree,
BoundaryOfficialDefinitions,
EmissionCategoryTree,
ActivityParamSchemas: mergedActivityParamSchemas,
DefaultActivityParamSchemas: clone(ActivityParamSchemas),
ModelStandardRules,

    ScopeCodeToLabel,
    ScopeLabelToCode,
    CategoryCodeToLabel,
    CategoryLabelToCode,
    SourceTypeCodeToLabel,
    SourceTypeLabelToCode,

    normalizeDatasourceId,
    buildMatchKey,
    matchModel,
    matchFactor,
    calculateEmission,
 getBoundaryClosureStatus,
refreshBoundaryClosureStatuses,
buildCalculationResults,
    getFactorGroupByModel,
    getDatasourceByIds,
    inferScopeByCategory,
    getBoundaryCategoryOptions,
    getBoundaryTree,
    getSourceCategoryTree,
getSourceCategoryOptionsByGroup,
getBoundaryCategoryOptionsForSourceForm,
  
    isBoundaryCategoryExists,
    upsertBoundaryCategory,
    addCustomScope3BoundaryCategory,
    getEnabledBoundaryCategories,
   getEnabledBoundaryModelCategories,
buildModelCategoryTree,
getModelStandardRule,
getDefaultFactorMatchFields,
isModelPeriodMatched,
normalizePeriodValue,
matchFactorByModelAndSource,
matchFactorGroupByModelAndSource,
matchSingleFactorByModelAndSource,
matchFactorSetByModelAndSource,
matchSingleFactorsByModelAndSource,
matchFactorPackageByModelAndSource,
getFactorsByGroup,
buildFactorVersionKey,
getFactorVersions,
getFactorVersionStatus,
createFactorNewVersion,
chooseCurrentVersion,
    getGwpVersions,
    enableOnlyOneGwpVersion,
    getGwpParameters,
    getGwpOperationLogs,
addGwpOperationLog,
    upsertGwpVersion,
    upsertGwpParameter,
    removeGwpVersion,
    removeGwpParameter,
    inferGwpVersionCode,
    inferGwpVersionId,
    getGwpVersionByRef,
    getGasGwp,
    getEmissionGroupByCategory,
    getEmissionCategoryNode,
    getActivityParamSchema,
    getActivityDataLabel,
    getAccountingParamLabel,
    normalizeAccountingParams,
    formatSourceActivityConfig,
    formatSourceActivityShortLabel,
    mergeActivityParamOptions,
    mergeActivityParams,
    mergeActivityParamSchemas,
    syncActivityParamOptionsFromSource,
    getActivityParamSchemas() {
      return clone(api.ActivityParamSchemas || {});
    },
    upsertActivityParamOption(category, paramKey, option = {}) {
      const categoryCode = category || "";
      const key = paramKey || "";
      if (!categoryCode || !key) return null;

      const currentSchemas = api.ActivityParamSchemas || {};
      const currentSchema = currentSchemas[categoryCode];

      if (!currentSchema) return null;

      const params = clone(currentSchema.params || []);
      const paramIndex = params.findIndex((item) => item.key === key);

      if (paramIndex < 0) return null;

      const label = String(option.label || option.name || "").trim();
      const value = String(option.value || makeCustomParamCode(label)).trim();

      if (!label || !value) return null;

      const nextOption = {
        value,
        label,
        unit: option.unit || currentSchema.defaultUnit || "",
        custom: option.custom !== false
      };

      params[paramIndex] = {
        ...params[paramIndex],
        options: mergeActivityParamOptions(params[paramIndex].options || [], [nextOption])
      };

      api.ActivityParamSchemas = {
        ...currentSchemas,
        [categoryCode]: {
          ...currentSchema,
          params,
          custom: currentSchema.custom === true
        }
      };

      api.saveState();

      return clone(nextOption);
    },
  getActivityRecordsBySource(sourceId) {
  const id = String(sourceId || "");
  return sortActivityRecords(
    api.ActivityDataRecords.filter((record) => String(record.sourceId || "") === id)
  );
},

getActivityRecordsBySourceOrDatasource(source = {}) {
  const sourceId = String(source.id || "");
  const datasourceIds = (source.datasourceIds || []).map(normalizeDatasourceId);

  const bySource = api.ActivityDataRecords.filter((record) =>
    String(record.sourceId || "") === sourceId
  );

  if (bySource.length) {
    return sortActivityRecords(bySource);
  }

  const byDatasource = api.ActivityDataRecords.filter((record) =>
    datasourceIds.includes(normalizeDatasourceId(record.datasourceId))
  );

  return sortActivityRecords(byDatasource);
},

getLatestActivityRecordBySource(sourceOrId) {
  if (typeof sourceOrId === "object" && sourceOrId) {
    return api.getActivityRecordsBySourceOrDatasource(sourceOrId)[0] || null;
  }

  return api.getActivityRecordsBySource(sourceOrId)[0] || null;
},

    getFactorStandard(standardId) {
      return api.FactorStandards.find((standard) => standard.id === standardId) || null;
    },

    toScopeLabel(value) {
      return ScopeCodeToLabel[value] || value || "—";
    },

    toScopeCode(value) {
      return ScopeLabelToCode[value] || value || "scope1";
    },

    toCategoryLabel(value) {
      return CategoryCodeToLabel[value] || value || "—";
    },

    toCategoryCode(value) {
      return CategoryLabelToCode[value] || value || "stationary_combustion";
    },

    toSourceTypeLabel(value) {
      return SourceTypeCodeToLabel[value] || value || "—";
    },

    toSourceTypeCode(value) {
      return SourceTypeLabelToCode[value] || value || "custom_source_type";
    },

    getBoundarySourceTypes(scope, category) {
      const scopeCode = api.toScopeCode(scope);
      const categoryCode = api.toCategoryCode(category);

      return api.BoundaryCategories.filter(
        (item) => item.scope === scopeCode && item.category === categoryCode
      );
    },

    getBoundSourcesByDatasourceId(datasourceId) {
      const id = normalizeDatasourceId(datasourceId);

      return api.EmissionSources.filter((source) =>
        (source.datasourceIds || []).map(normalizeDatasourceId).includes(id)
      );
    },

    getActivityRecordsByDatasource(datasourceId) {
      const id = normalizeDatasourceId(datasourceId);
      return sortActivityRecords(
        api.ActivityDataRecords.filter((record) => normalizeDatasourceId(record.datasourceId) === id)
      );
    },

    getLatestActivityRecordByDatasource(datasourceId) {
      return api.getActivityRecordsByDatasource(datasourceId)[0] || null;
    },

    addActivityDataRecord(record = {}) {
      const normalizedRecord = {
        ...record,
        id: record.id || `adr-${Date.now()}`,
        datasourceId: normalizeDatasourceId(record.datasourceId),
        period: record.period || "",
        collectedAt: record.collectedAt || new Date().toISOString(),
        status: record.status || "待确认"
      };
      api.ActivityDataRecords.unshift(normalizedRecord);
      api.ActivityDataRecords = sortActivityRecords(api.ActivityDataRecords);
      api.saveState();
      return normalizedRecord;
    },

    getEmissionSources() {
      return api.EmissionSources;
    },

    getAccountingModels() {
      return api.AccountingModels.map(normalizeAccountingModel);
    },

saveState() {
  try {
    if (typeof refreshBoundaryClosureStatuses === "function") {
      refreshBoundaryClosureStatuses();
    }
    if (typeof refreshCalculationResults === "function") {
      refreshCalculationResults();
    }

    root.localStorage?.setItem(
      STORAGE_KEY,
      JSON.stringify({
        BoundaryCategories: api.BoundaryCategories,
        BoundaryCategoryOptions: api.BoundaryCategoryOptions,
        ActivityParamSchemas: api.ActivityParamSchemas,
        EmissionSources: api.EmissionSources,
        AccountingModels: api.AccountingModels,
        DataSources: api.DataSources,
        ActivityDataRecords: api.ActivityDataRecords,
        ActivityRecordsVersion: ACTIVITY_RECORDS_VERSION,
        FactorLibraryVersion: FACTOR_LIBRARY_VERSION,
        FactorLibraryFactors: api.FactorLibraryFactors,
        FactorLibraryGroups: api.FactorLibraryGroups,
        FactorStandards: api.FactorStandards,
        GwpVersions: api.GwpVersions,
        GwpParameters: api.GwpParameters,
        GwpOperationLogs: api.GwpOperationLogs
      })
    );
  } catch (error) {}

  root.dispatchEvent?.(
    new CustomEvent("carbon-mock-updated", { detail: api })
  );

  // 🔥【核心补丁：线上环境穿透广播】向外层的父壳体大喊：“数据改了，必须强刷！”
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: "carbon-mock-updated-global" }, "*");
  }
},

    upsertEmissionSource(source) {
      const normalizedSource = normalizeEmissionSource(source);
      syncActivityParamOptionsFromSource(normalizedSource);
      if (normalizedSource.scope && normalizedSource.category && !api.isBoundaryCategoryExists(normalizedSource.scope, normalizedSource.category)) {
  const option = api.getBoundaryCategoryOptions(normalizedSource.scope).find((item) => item.category === normalizedSource.category) || {};
  api.upsertBoundaryCategory({
    scope: normalizedSource.scope,
    category: normalizedSource.category,
    categoryLabel: normalizedSource.categoryLabel || option.categoryLabel,
    included: true,
    status: "待完善",
    description: "由排放源新增时自动同步到核算边界。"
  });
}
      const index = api.EmissionSources.findIndex(
        (item) => item.id === normalizedSource.id
      );

      if (index >= 0) {
        api.EmissionSources.splice(index, 1, {
          ...api.EmissionSources[index],
          ...normalizedSource
        });
      } else {
        api.EmissionSources.unshift(normalizedSource);
      }

      api.saveState();
    },

    addEmissionSource(source) {
      const id = source.id || `es-${Date.now()}`;
      api.upsertEmissionSource({ ...source, id });
      return api.EmissionSources.find((item) => item.id === id) || null;
    },

    updateEmissionSource(id, patch) {
      const current = api.EmissionSources.find((item) => item.id === id);
      if (!current) return null;
      const next = {
        ...current,
        ...patch,
        id,
        datasourceIds: Object.prototype.hasOwnProperty.call(patch || {}, "datasourceIds")
          ? patch.datasourceIds
          : current.datasourceIds
      };
      api.upsertEmissionSource(next);
      return api.EmissionSources.find((item) => item.id === id) || null;
    },

   removeEmissionSource(sourceId) {
  const id = String(sourceId || '');
  if (!id) return false;

  const before = api.EmissionSources.length;

  api.EmissionSources = api.EmissionSources.filter(source => String(source.id) !== id);

  // 演示闭环里建议一起删掉该排放源的活动数据，避免 boundary / 计算结果继续读到旧 AD
  api.ActivityDataRecords = (api.ActivityDataRecords || []).filter(record => String(record.sourceId) !== id);

  api.CalculationResults = typeof buildCalculationResults === 'function'
    ? buildCalculationResults(api.EmissionSources)
    : api.CalculationResults;

  api.saveState();

  return api.EmissionSources.length !== before;
},

    upsertAccountingModel(model) {
      const normalizedModel = normalizeAccountingModel(model);
      const index = api.AccountingModels.findIndex((item) => item.id === normalizedModel.id);

      if (index >= 0) {
        api.AccountingModels.splice(index, 1, normalizeAccountingModel({ ...api.AccountingModels[index], ...normalizedModel }));
      } else {
        api.AccountingModels.unshift(normalizedModel);
      }

      api.saveState();
      return api.AccountingModels.find((item) => item.id === normalizedModel.id) || null;
    },

    addAccountingModel(model) {
      return api.upsertAccountingModel({
        ...model,
        id: model.id || `am-${Date.now()}`
      });
    },

    updateAccountingModel(id, patch) {
      const current = api.AccountingModels.find((item) => item.id === id);
      if (!current) return null;
      return api.upsertAccountingModel({ ...current, ...patch, id });
    },

    removeAccountingModel(modelId) {
      const index = api.AccountingModels.findIndex((item) => item.id === modelId);

      if (index >= 0) {
        api.AccountingModels.splice(index, 1);
      }

      api.saveState();
    },

    upsertFactorLibraryItem(kind, item) {
      const list = kind === "group" ? api.FactorLibraryGroups : api.FactorLibraryFactors;
      const nextItem = kind === "group" ? normalizeFactorLibraryGroup(item) : normalizeFactorLibraryFactor(item);
      const index = list.findIndex((row) => row.id === item.id);

      if (index >= 0) {
        list.splice(index, 1, kind === "group" ? normalizeFactorLibraryGroup({ ...list[index], ...nextItem }) : normalizeFactorLibraryFactor({ ...list[index], ...nextItem }));
      } else {
        list.unshift(nextItem);
      }

      api.saveState();
    },

    removeFactorLibraryItem(kind, itemId) {
      const list = kind === "group" ? api.FactorLibraryGroups : api.FactorLibraryFactors;
      const index = list.findIndex((item) => item.id === itemId);

      if (index >= 0) {
        list.splice(index, 1);
      }

      api.saveState();
    },

    upsertFactorStandard(standard) {
      const index = api.FactorStandards.findIndex((item) => item.id === standard.id);

      if (index >= 0) {
        api.FactorStandards.splice(index, 1, { ...api.FactorStandards[index], ...standard });
      } else {
        api.FactorStandards.unshift(standard);
      }

      api.saveState();
    },

    removeFactorStandard(standardId) {
      const index = api.FactorStandards.findIndex((item) => item.id === standardId);

      if (index >= 0) {
        api.FactorStandards.splice(index, 1);
      }

      api.saveState();
    },

    resetMockState() {
      try {
        root.localStorage?.removeItem(STORAGE_KEY);
      } catch (error) {}
    }
  };

  api.CalculationModels = api.AccountingModels;
  api.EmissionFactors = api.FactorLibraryGroups;
  api.CalculationResults = buildCalculationResults();

function refreshCalculationResults() {
  api.CalculationModels = api.AccountingModels;
  api.EmissionFactors = api.FactorLibraryGroups;
  api.CalculationResults = buildCalculationResults();
  root.CalculationModels = api.CalculationModels;
  root.EmissionFactors = api.EmissionFactors;
  root.CalculationResults = api.CalculationResults;
}

const originalSaveState = api.saveState;
api.saveState = function saveStateWithCalculationResults() {
  refreshCalculationResults();
  refreshBoundaryClosureStatuses();
  return originalSaveState.call(api);
};

refreshCalculationResults();
refreshBoundaryClosureStatuses();

  root.CarbonAccountingMock = api;

  Object.assign(root, api);

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
