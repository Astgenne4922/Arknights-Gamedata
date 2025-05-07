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

const uniequip_table = await fetch(`${BASE_URL}/uniequip_table.json`).then((r) => r.json());
const uniequip_table_entries = Object.entries(uniequip_table.equipDict);

const charword_table = await fetch(`${BASE_URL}/charword_table.json`).then((r) => r.json());
const charword_entries = Object.entries(charword_table.charWords);
const voiceLangDict_entries = Object.entries(charword_table.voiceLangDict);

const skin_table = await fetch(`${BASE_URL}/skin_table.json`).then((r) => r.json());
const skin_table_entries = Object.entries(skin_table.charSkins);

const outer_array = [];

[...Object.entries(character_table), ...Object.entries(char_patch_table.patchChars)].forEach(
    ([code, character]) => {
        if (!code.startsWith("char_")) return;

        outer_array.push({ code: code, name: character.name });

        // TODO rimuovere i rich text styles

        // TODO aggiungi al file generale modi per filtrare (vedi gioco)

        // TODO trovare modo di eliminare robe come i reserve ops (prova con files vuoti)

        // TODO distingui i nomi di amiya per classe

        const acc = {
            name: character.name,
            description: character.description,
            nationId: character.nationId, //TODO full name
            groupId: character.groupId,
            appellation: character.appellation.trim() ? character.appellation : null,
            itemUsage: character.itemUsage,
            itemDesc: character.itemDesc,
            rarity: character.rarity,
            profession: character.profession,
            subProfessionId: character.subProfessionId,
        };

        const handbookDict = handbook_info_table.handbookDict[code];
        if (code === "char_002_amiya") {
            acc.files =
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
            acc.files =
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
            acc.files =
                handbookDict?.storyTextAudio.map((file) => ({
                    title: file.storyTitle,
                    body: file.stories[0].storyText,
                })) ?? null;
        }

        if (!Array.isArray(handbookDict?.handbookAvgList)) acc.records = null;
        else
            acc.records = handbookDict.handbookAvgList.map((record) => {
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
            acc.baseSkin = {
                id: `${code}#1`,
                description: skin_table.charSkins[`${code}#1`].displaySkin.content,
                isDynamic: skin_table.charSkins[`${code}#1`].dynIllustId !== undefined,
            };
        else acc.baseSkin = null;

        if (skin_table.charSkins[`${code}#1+`])
            acc.elite1Skin = {
                id: `${code}#1+`,
                description: skin_table.charSkins[`${code}#1+`].displaySkin.content,
                isDynamic: skin_table.charSkins[`${code}#1+`].dynIllustId !== undefined,
            };
        else acc.elite1Skin = null;

        if (skin_table.charSkins[`${code}#2`])
            acc.elite2Skin = {
                id: `${code}#2`,
                description: skin_table.charSkins[`${code}#2`].displaySkin.content,
                isDynamic: skin_table.charSkins[`${code}#2`].dynIllustId !== undefined,
            };
        else acc.elite2Skin = null;

        const skins = skin_table_entries.filter(([skinCode, _]) => skinCode.startsWith(`${code}@`));
        if (skins.length > 0)
            acc.skins = skins.map(([skinCode, skinObject]) => ({
                id: skinCode,
                name: skinObject.displaySkin.skinName,
                line1: skinObject.displaySkin.usage,
                line2: skinObject.displaySkin.description,
                line3: skinObject.displaySkin.dialog,
                isDynamic: skinObject.dynIllustId !== undefined,
            }));
        else acc.skins = null;

        acc.voices = charword_entries
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

        acc.dubs = charword_table.voiceLangDict[code]
            ? Object.keys(charword_table.voiceLangDict[code].dict)
            : null;

        const skinVoices = charword_entries.filter(
            ([voiceCode, _]) =>
                voiceCode.startsWith(code) &&
                voiceCode.includes("#") &&
                voiceCode.split("_").length === 6
        );
        if (skinVoices.length > 0)
            acc.skinVoices = skinVoices.map(([_, voiceObject]) => ({
                id: voiceObject.voiceId,
                name: voiceObject.voiceTitle,
                body: voiceObject.voiceText,
            }));
        else acc.skinVoices = null;

        const skinDubs = voiceLangDict_entries.filter(
            ([dubCode, _]) =>
                dubCode.startsWith(code) && dubCode.includes("#") && dubCode.split("_").length === 4
        );
        if (skinDubs.length > 0)
            acc.skinDubs = skinDubs.map(([dubCode, dubObject]) => ({
                [dubCode]: Object.keys(dubObject.dict),
            }));
        else acc.skinDubs = null;

        const modules = uniequip_table_entries.filter(([moduleCode, _]) =>
            moduleCode.endsWith(code.split("_").at(-1))
        );
        if (modules.length > 0)
            acc.modules = modules.map(([_, moduleObject]) => ({
                name: moduleObject.uniEquipName,
                icon: moduleObject.uniEquipIcon,
                description: moduleObject.uniEquipDesc,
                code: moduleObject.typeIcon,
            }));
        else acc.modules = null;

        fs.mkdirSync(`./characters/${code}`, { recursive: true });
        fs.writeFile(
            `./characters/${code}/character.json`,
            JSON.stringify(acc, null, 4),
            "utf-8",
            () => {}
        );
    }
);

fs.mkdirSync("./characters", { recursive: true });
fs.writeFile(
    "./characters/character_codes.json",
    JSON.stringify(outer_array, null, 4),
    "utf-8",
    () => {}
);
