import fs from "fs";

const BASE_URL = `https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/refs/heads/master/en/gamedata`;

const enemy_handbook_table = await fetch(`${BASE_URL}/excel/enemy_handbook_table.json`).then((r) =>
    r.json()
);
const enemy_database = await fetch(`${BASE_URL}/levels/enemydata/enemy_database.json`).then((r) =>
    r.json()
);

const outer_array = [];
const filters = { ranks: [], categories: [], ranges: [], damageTypes: [] };

Object.entries(enemy_handbook_table.enemyData).forEach(([code, enemyObject]) => {
    if (enemyObject.hideInHandbook) return;

    const database = enemy_database.find((obj) => obj.Key === code).Value[0].enemyData;

    // TODO trova modo per filtrare per evento (da valutare)

    const enemy = {
        name: enemyObject.name,
        tag: enemyObject.enemyIndex,
        description: enemyObject.description,
        rank: enemyObject.enemyLevel,
        damageTypes: enemyObject.damageType,

        rangeType: database.applyWay.m_value,

        lifePenality: database.lifePointReduce.m_value,
    };

    if (!filters.ranks.includes(enemy.rank)) filters.ranks.push(enemy.rank);
    if (!filters.ranges.includes(enemy.rangeType) && enemy.rangeType !== "ALL")
        filters.ranges.push(enemy.rangeType);
    enemy.damageTypes.forEach((d) => {
        if (!filters.damageTypes.includes(d)) filters.damageTypes.push(d);
    });

    enemy.abilities = Object.values(enemyObject.abilityList).map((a) => ({
        ...a,
        text: a.text.replace(/(<[^\/]*>|<\/>)/gm, ""),
    }));

    if (database.enemyTags.m_defined && database.enemyTags.m_value)
        enemy.categories = Object.values(database.enemyTags.m_value).map((v) => {
            if (!filters.categories.includes(enemy_handbook_table.raceData[v].raceName))
                filters.categories.push(enemy_handbook_table.raceData[v].raceName);
            return enemy_handbook_table.raceData[v].raceName;
        });
    else enemy.categories = [];

    for (let i = enemy_handbook_table.levelInfoList.length - 1; i >= 0; i--) {
        if (database.attributes.maxHp.m_value >= enemy_handbook_table.levelInfoList[i].maxHP.min)
            enemy.hp = enemy_handbook_table.levelInfoList[i].classLevel;

        if (database.attributes.atk.m_value >= enemy_handbook_table.levelInfoList[i].attack.min)
            enemy.atk = enemy_handbook_table.levelInfoList[i].classLevel;

        if (database.attributes.def.m_value >= enemy_handbook_table.levelInfoList[i].def.min)
            enemy.def = enemy_handbook_table.levelInfoList[i].classLevel;

        if (
            database.attributes.magicResistance.m_value >=
            enemy_handbook_table.levelInfoList[i].magicRes.min
        )
            enemy.res = enemy_handbook_table.levelInfoList[i].classLevel;

        if (
            database.attributes.moveSpeed.m_value >=
            enemy_handbook_table.levelInfoList[i].moveSpeed.min
        )
            enemy.speed = enemy_handbook_table.levelInfoList[i].classLevel;

        if (
            database.attributes.epDamageResistance.m_value >=
            enemy_handbook_table.levelInfoList[i].enemyDamageRes.min
        )
            enemy.eRes = enemy_handbook_table.levelInfoList[i].classLevel;

        if (
            database.attributes.epResistance.m_value >=
            enemy_handbook_table.levelInfoList[i].enemyRes.min
        )
            enemy.eRst = enemy_handbook_table.levelInfoList[i].classLevel;
    }

    enemy_handbook_table.levelInfoList.forEach((l) => {
        if (database.attributes.baseAttackTime.m_value >= l.attackSpeed.min)
            enemy.aspd = l.classLevel;
    });

    enemy.weight = database.attributes.massLevel.m_value;

    enemy.statusImmunities = Object.entries(database.attributes)
        .filter(([key, _]) => key.endsWith("Immune"))
        .reduce((obj, [statusName, isImmune]) => {
            obj[statusName.replace("Immune", "")] = isImmune.m_value;
            return obj;
        }, {});

    outer_array.push({
        code: code,
        name: enemy.name,
        rank: enemy.rank,
        categories: enemy.categories,
        rangeType: enemy.rangeType,
        damageTypes: enemy.damageTypes,
    });

    fs.mkdirSync(`./enemies/${code}`, { recursive: true });
    fs.writeFile(`./enemies/${code}/enemy.json`, JSON.stringify(enemy, null, 4), "utf-8", () => {});
});

fs.mkdirSync("./enemies", { recursive: true });
fs.writeFile("./enemies/enemy_codes.json", JSON.stringify(outer_array, null, 4), "utf-8", () => {});
fs.writeFile("./enemies/enemy_filters.json", JSON.stringify(filters, null, 4), "utf-8", () => {});
