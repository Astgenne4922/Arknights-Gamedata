import fs from "fs";

const analisi = {};
try {
    const dir = await fs.promises.opendir("./stories");
    for await (const dirent of dir) {
        if (dirent.isDirectory()) {
            const story = await fs.promises.opendir(`./stories/${dirent.name}/scripts`);
            for await (const file of story) {
                const str = fs.readFileSync(`./stories/${dirent.name}/scripts/${file.name}`, "utf-8");

                for (const line of str.split("\n")) {
                    let match = line.match(/^\[(\w+)(?:\((.*)\))?\](?:\s*(.+))?$/);
                    if (match?.[1]?.toLowerCase() !== "sticker") continue;
                    if (!match?.[2]) continue;
                    let check = false;
                    [...(match?.[2]?.matchAll(/(\w+)\s*=\s*(?:"([^"]*)"|([^",\s]*))/g) ?? [])].forEach((p) => {
                        if (p[1] === "delay") check = true;
                    });
                    if (!check) console.log(line);
                }
            }
        }
    }
} catch (err) {
    console.error(err);
}
