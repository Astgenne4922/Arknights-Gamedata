import fs from "fs";

const analisi = {};
try {
    const dir = await fs.promises.opendir("./stories");
    for await (const dirent of dir) {
        if (dirent.isDirectory()) {
            const story = await fs.promises.opendir(`./stories/${dirent.name}/scripts`);
            console.log(`./stories/${dirent.name}/scripts`);
            for await (const file of story) {
                const str = fs.readFileSync(`./stories/${dirent.name}/scripts/${file.name}`, "utf-8");

                for (const line of str.split("\n")) {
                    let match = line.match(/^\[(\w+)(?:\((.*)\))?\](?:\s*(.+))?$/);
                    [...(match?.[2]?.matchAll(/(\w+)\s*=\s*(?:"([^"]*)"|([^",\s]*))/g) ?? [])].forEach((p) => {
                        if (!analisi[match[1].toLowerCase()]) analisi[match[1].toLowerCase()] = [];
                        if (!analisi[match[1].toLowerCase()]?.includes(p[1]))
                            analisi[match[1].toLowerCase()].push(p[1]);
                    });
                }
            }
        }
    }

    fs.writeFileSync("./analisi.json", JSON.stringify(analisi, null, 4));
} catch (err) {
    console.error(err);
}
