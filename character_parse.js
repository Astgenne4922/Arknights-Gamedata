import fs from "fs";

const BASE_URL = `https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/refs/heads/master/en/gamedata/excel`;

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

const full_json = [
    ...Object.entries(character_table),
    ...Object.entries(char_patch_table.patchChars),
].reduce((acc, [code, character]) => {
    if (!code.startsWith("char_")) return acc;

    acc[code] = {
        name: character.name,
        description: character.description,
        nationId: character.nationId,
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
        acc[code].files =
            handbookDict?.storyTextAudio.reduce((files, file) => {
                if (file.stories[0].unLockType === "PATCH" || file.storyTitle === "？？？")
                    return files;
                files.push({
                    title: file.storyTitle,
                    body: file.stories[0].storyText,
                });
                return files;
            }, []) ?? null;
    } else if (code.includes("amiya")) {
        acc[code].files =
            handbook_info_table.handbookDict["char_002_amiya"]?.storyTextAudio.reduce(
                (files, file) => {
                    if (file.stories[0].unLockParam !== code) return files;
                    files.push({
                        title: file.storyTitle,
                        body: file.stories[0].storyText,
                    });
                    return files;
                },
                []
            ) ?? null;
    } else {
        acc[code].files =
            handbookDict?.storyTextAudio.map((file) => ({
                title: file.storyTitle,
                body: file.stories[0].storyText,
            })) ?? null;
    }
    acc[code].records = !Array.isArray(handbookDict?.handbookAvgList)
        ? null
        : handbookDict.handbookAvgList.map((record) => ({
              title: record.storySetName,
              parts: record.avgList.map((part) => {
                  fetch(
                      `https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/refs/heads/master/en/gamedata/story/${part.storyTxt}.txt`
                  )
                      .then((res) => res.text())
                      .then((text) => {
                          fs.mkdirSync(`./characters/${code}/records`, { recursive: true });
                          fs.writeFile(
                              `./characters/${code}/records/${part.storyTxt.split("/").at(-1)}.txt`,
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
          }));

    if (skin_table.charSkins[`${code}#1`])
        acc[code].baseSkin = {
            id: `${code}#1`,
            description: skin_table.charSkins[`${code}#1`].displaySkin.content,
            isDynamic: skin_table.charSkins[`${code}#1`].dynIllustId !== undefined,
        };
    else acc[code].baseSkin = null;

    if (skin_table.charSkins[`${code}#1+`])
        acc[code].elite1Skin = {
            id: `${code}#1+`,
            description: skin_table.charSkins[`${code}#1+`].displaySkin.content,
            isDynamic: skin_table.charSkins[`${code}#1+`].dynIllustId !== undefined,
        };
    else acc[code].elite1Skin = null;

    if (skin_table.charSkins[`${code}#2`])
        acc[code].elite2Skin = {
            id: `${code}#2`,
            description: skin_table.charSkins[`${code}#2`].displaySkin.content,
            isDynamic: skin_table.charSkins[`${code}#2`].dynIllustId !== undefined,
        };
    else acc[code].elite2Skin = null;

    const skins = skin_table_entries.filter(([skinCode, _]) => skinCode.startsWith(`${code}@`));
    if (skins.length > 0)
        acc[code].skins = skins.map(([skinCode, skinObject]) => ({
            id: skinCode,
            name: skinObject.displaySkin.skinName,
            line1: skinObject.displaySkin.usage,
            line2: skinObject.displaySkin.description,
            line3: skinObject.displaySkin.dialog,
            isDynamic: skinObject.dynIllustId !== undefined,
        }));
    else acc[code].skins = null;

    acc[code].voices = charword_entries
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

    acc[code].dubs = charword_table.voiceLangDict[code]
        ? Object.keys(charword_table.voiceLangDict[code].dict)
        : null;

    const skinVoices = charword_entries.filter(
        ([voiceCode, _]) =>
            voiceCode.startsWith(code) &&
            voiceCode.includes("#") &&
            voiceCode.split("_").length === 6
    );
    if (skinVoices.length > 0)
        acc[code].skinVoices = skinVoices.map(([_, voiceObject]) => ({
            id: voiceObject.voiceId,
            name: voiceObject.voiceTitle,
            body: voiceObject.voiceText,
        }));
    else acc[code].skinVoices = null;

    const skinDubs = voiceLangDict_entries.filter(
        ([dubCode, _]) =>
            dubCode.startsWith(code) && dubCode.includes("#") && dubCode.split("_").length === 4
    );
    if (skinDubs.length > 0)
        acc[code].skinDubs = skinDubs.map(([dubCode, dubObject]) => ({
            [dubCode]: Object.keys(dubObject.dict),
        }));
    else acc[code].skinDubs = null;

    const modules = uniequip_table_entries.filter(([moduleCode, _]) =>
        moduleCode.endsWith(code.split("_").at(-1))
    );
    if (modules.length > 0)
        acc[code].modules = modules.map(([_, moduleObject]) => ({
            name: moduleObject.uniEquipName,
            icon: moduleObject.uniEquipIcon,
            description: moduleObject.uniEquipDesc,
            code: moduleObject.typeIcon,
        }));
    else acc[code].modules = null;

    fs.mkdirSync(`./characters/${code}`, { recursive: true });
    fs.writeFile(
        `./characters/${code}/character.json`,
        JSON.stringify(acc[code], null, 4),
        "utf-8",
        () => {}
    );

    return acc;
}, {});

fs.mkdirSync("./characters", { recursive: true });
fs.writeFile(
    "./characters/character_codes.json",
    JSON.stringify(Object.keys(full_json).sort(), null, 4),
    "utf-8",
    () => {}
);
