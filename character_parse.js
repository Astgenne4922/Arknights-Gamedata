import fs from "fs";

const BASE_URL =
    "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/refs/heads/master/en/gamedata/excel";
const STORY_URL =
    "https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/refs/heads/master/en/gamedata/story";

const character_table = await fetch(`${BASE_URL}/character_table.json`).then((r) => r.json());
const char_patch_table = await fetch(`${BASE_URL}/char_patch_table.json`).then((r) => r.json());

const handbook_info_table = await fetch(`${BASE_URL}/handbook_info_table.json`).then((r) =>
    r.json()
);
const handbook_team_table = await fetch(`${BASE_URL}/handbook_team_table.json`).then((r) =>
    r.json()
);

const uniequip_table = await fetch(`${BASE_URL}/uniequip_table.json`).then((r) => r.json());
const uniequip_table_entries = Object.entries(uniequip_table.equipDict);

const charword_table = await fetch(`${BASE_URL}/charword_table.json`).then((r) => r.json());
const charword_entries = Object.entries(charword_table.charWords);
const voiceLangDict_entries = Object.entries(charword_table.voiceLangDict);

const skin_table = await fetch(`${BASE_URL}/skin_table.json`).then((r) => r.json());
const skin_table_entries = Object.entries(skin_table.charSkins);

const outer_array = [];
const filters = { rarities: [], classes: [], subClasses: [], factions: [] };

[...Object.entries(character_table), ...Object.entries(char_patch_table.patchChars)].forEach(
    ([code, characterObject]) => {
        if (
            !Object.keys(handbook_info_table.handbookDict).includes(code) &&
            !code.includes("amiya")
        )
            return;

        const character = {
            name: characterObject.name,
            classDescription: characterObject.description.replace(/(<[^\/]*>|<\/>)/gm, ""),
            faction:
                handbook_team_table[
                    characterObject.nationId ??
                        characterObject.groupId ??
                        characterObject.teamId ??
                        "rhodes"
                ].powerName,
            appellation: characterObject.appellation.trim() ? characterObject.appellation : null,
            description1: characterObject.itemUsage,
            description2: characterObject.itemDesc,
            rarity: characterObject.rarity,
            class: characterObject.profession,
            subClass: uniequip_table.subProfDict[characterObject.subProfessionId].subProfessionName,
        };

        const handbookDict = handbook_info_table.handbookDict[code];
        if (code === "char_002_amiya") {
            character.files =
                handbookDict?.storyTextAudio.reduce((files, file) => {
                    if (
                        !file.stories[0].patchIdList.includes(code) ||
                        file.stories[0].unLockType === "PATCH" ||
                        file.storyTitle === "？？？"
                    )
                        return files;
                    files.push({
                        title: file.storyTitle,
                        body: file.stories[0].storyText,
                    });
                    return files;
                }, []) ?? null;
        } else if (code.includes("amiya")) {
            character.name += ` (${character.class})`;
            character.files =
                handbook_info_table.handbookDict["char_002_amiya"]?.storyTextAudio.reduce(
                    (files, file) => {
                        if (
                            !file.stories[0].patchIdList.includes(code) ||
                            file.storyTitle === "？？？"
                        )
                            return files;
                        files.push({
                            title: file.storyTitle,
                            body: file.stories[0].storyText,
                        });
                        return files;
                    },
                    []
                ) ?? null;
        } else {
            character.files =
                handbookDict?.storyTextAudio.map((file) => ({
                    title: file.storyTitle,
                    body: file.stories[0].storyText,
                })) ?? null;
        }

        if (!Array.isArray(handbookDict?.handbookAvgList)) character.records = null;
        else
            character.records = handbookDict.handbookAvgList.map((record) => {
                return {
                    title: record.storySetName,
                    parts: record.avgList.map((part) => {
                        fetch(`${STORY_URL}/${part.storyTxt}.txt`)
                            .then((res) => res.text())
                            .then((text) => {
                                fs.mkdirSync(`./characters/${code}/records`, {
                                    recursive: true,
                                });
                                fs.writeFile(
                                    `./characters/${code}/records/${part.storyTxt
                                        .split("/")
                                        .at(-1)}.txt`,
                                    text,
                                    "utf-8",
                                    () => {}
                                );
                            });

                        return {
                            intro: part.storyIntro,
                            body: part.storyTxt,
                        };
                    }),
                };
            });

        if (skin_table.charSkins[`${code}#1`])
            character.baseSkin = {
                id: `${code}#1`,
                description: skin_table.charSkins[`${code}#1`].displaySkin.content,
                isDynamic: skin_table.charSkins[`${code}#1`].dynIllustId !== undefined,
            };
        else character.baseSkin = null;

        if (skin_table.charSkins[`${code}#1+`])
            character.elite1Skin = {
                id: `${code}#1+`,
                description: skin_table.charSkins[`${code}#1+`].displaySkin.content,
                isDynamic: skin_table.charSkins[`${code}#1+`].dynIllustId !== undefined,
            };
        else character.elite1Skin = null;

        if (skin_table.charSkins[`${code}#2`])
            character.elite2Skin = {
                id: `${code}#2`,
                description: skin_table.charSkins[`${code}#2`].displaySkin.content,
                isDynamic: skin_table.charSkins[`${code}#2`].dynIllustId !== undefined,
            };
        else character.elite2Skin = null;

        const skins = skin_table_entries.filter(([skinCode, _]) => skinCode.startsWith(`${code}@`));
        if (skins.length > 0)
            character.skins = skins.map(([skinCode, skinObject]) => ({
                id: skinCode,
                name: skinObject.displaySkin.skinName,
                line1: skinObject.displaySkin.usage,
                line2: skinObject.displaySkin.description,
                line3: skinObject.displaySkin.dialog,
                isDynamic: skinObject.dynIllustId !== undefined,
            }));
        else character.skins = null;

        character.voices = charword_entries
            .filter(
                ([voiceCode, _]) =>
                    voiceCode.startsWith(code) &&
                    !voiceCode.includes("#") &&
                    voiceCode.split("_").length === 5
            )
            .map(([_, voiceObject]) => ({
                id: voiceObject.voiceId,
                name: voiceObject.voiceTitle,
                body: voiceObject.voiceText,
            }));

        character.dubs = charword_table.voiceLangDict[code]
            ? Object.keys(charword_table.voiceLangDict[code].dict)
            : null;

        const skinVoices = charword_entries.filter(
            ([voiceCode, _]) =>
                voiceCode.startsWith(code) &&
                voiceCode.includes("#") &&
                voiceCode.split("_").length === 6
        );
        if (skinVoices.length > 0)
            character.skinVoices = skinVoices.map(([_, voiceObject]) => ({
                id: voiceObject.voiceId,
                name: voiceObject.voiceTitle,
                body: voiceObject.voiceText,
            }));
        else character.skinVoices = null;

        const skinDubs = voiceLangDict_entries.filter(
            ([dubCode, _]) =>
                dubCode.startsWith(code) && dubCode.includes("#") && dubCode.split("_").length === 4
        );
        if (skinDubs.length > 0)
            character.skinDubs = skinDubs.map(([dubCode, dubObject]) => ({
                [dubCode]: Object.keys(dubObject.dict),
            }));
        else character.skinDubs = null;

        const modules = uniequip_table_entries.filter(([moduleCode, _]) =>
            moduleCode.endsWith(code.split("_").at(-1))
        );
        if (modules.length > 0)
            character.modules = modules.map(([_, moduleObject]) => ({
                name: moduleObject.uniEquipName,
                icon: moduleObject.uniEquipIcon,
                description: moduleObject.uniEquipDesc,
                code: moduleObject.typeIcon,
            }));
        else character.modules = null;

        outer_array.push({
            code: character.code,
            name: character.name,
            rarity: character.rarity,
            profession: character.class,
            subProfessionId: character.subClass,
            nationId: character.faction,
        });

        if (!filters.rarities.includes(character.rarity)) filters.rarities.push(character.rarity);
        if (!filters.classes.includes(character.class)) filters.classes.push(character.class);
        if (!filters.subClasses.includes(character.subClass))
            filters.subClasses.push(character.subClass);
        if (!filters.factions.includes(character.faction)) filters.factions.push(character.faction);

        fs.mkdirSync(`./characters/${code}`, { recursive: true });
        fs.writeFile(
            `./characters/${code}/character.json`,
            JSON.stringify(character, null, 4),
            "utf-8",
            () => {}
        );
    }
);

fs.mkdirSync("./characters", { recursive: true });
fs.writeFile(
    "./characters/character_codes.json",
    JSON.stringify(
        outer_array.sort((a, b) => {
            if (a.rarity > b.rarity) return -1;
            else if (a.rarity < b.rarity) return 1;
            else {
                if (a.name < b.name) {
                    return -1;
                }
                if (a.name > b.name) {
                    return 1;
                }
                return 0;
            }
        }),
        null,
        4
    ),
    "utf-8",
    () => {}
);
fs.writeFile(
    "./characters/character_filters.json",
    JSON.stringify(filters, null, 4),
    "utf-8",
    () => {}
);
