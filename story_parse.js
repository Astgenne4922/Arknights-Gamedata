import fs from "fs";

const BASE_URL = `https://raw.githubusercontent.com/ArknightsAssets/ArknightsGamedata/refs/heads/master/en/gamedata`;

const story_review_table = Object.entries(
    await fetch(`${BASE_URL}/excel/story_review_table.json`).then((r) => r.json())
);

const code_regex = /(?:act\d+d\d+)|(?:act\d+side)|(?:act\d+mini)|(?:main_\d+)|(?:1stact)/;

const outer_array = [];

story_review_table.forEach(([code, storyObject]) => {
    if (!code_regex.test(code)) return;

    outer_array.push({
        code: code,
        name: storyObject.name,
        type: storyObject.entryType,
    });

    const story = {
        name: storyObject.name,
        type: storyObject.entryType,
        parts: storyObject.infoUnlockDatas.reduce((parts, e) => {
            const key = storyObject.entryType === "MINI_ACTIVITY" ? "storyName" : "storyCode";

            if (parts[e[key]] === undefined)
                parts[e[key]] = {
                    storyName: e.storyName,
                    before: null,
                    after: null,
                    interlude: null,
                    dependence: null,
                };

            const dependence = storyObject.infoUnlockDatas.reduce(
                (n, a) => {
                    if (a.storySort < e.storySort)
                        return {
                            storySort: Math.max(n.storySort, a.storySort),
                            [key]: n.storySort < a.storySort ? a[key] : n[key],
                        };
                    else return n;
                },
                { storySort: Number.MIN_VALUE }
            )[key];

            switch (e.avgTag) {
                case "Before Operation":
                    parts[e[key]].before = e.storyTxt.split("/").at(-1);
                    parts[e[key]].dependence = dependence ?? null;
                    break;
                case "After Operation":
                    parts[e[key]].after = e.storyTxt.split("/").at(-1);
                    if (parts[e[key]].before === null)
                        parts[e[key]].dependence = dependence ?? null;
                    break;
                case "Interlude":
                    parts[e[key]].interlude = e.storyTxt.split("/").at(-1);
                    parts[e[key]].dependence = dependence ?? null;
                    break;
            }

            fetch(`${BASE_URL}/story/${e.storyTxt}.txt`)
                .then((res) => res.text())
                .then((text) => {
                    fs.mkdirSync(`./stories/${code}/scripts`, {
                        recursive: true,
                    });
                    fs.writeFile(
                        `./stories/${code}/scripts/${e.storyTxt.split("/").at(-1) ?? null}.txt`,
                        text,
                        "utf-8",
                        () => {}
                    );
                });

            return parts;
        }, {}),
    };

    fs.mkdirSync(`./stories/${code}`, { recursive: true });
    fs.writeFile(`./stories/${code}/story.json`, JSON.stringify(story, null, 4), "utf-8", () => {});
});

fs.mkdirSync("./stories", { recursive: true });
fs.writeFile("./stories/story_codes.json", JSON.stringify(outer_array, null, 4), "utf-8", () => {});
