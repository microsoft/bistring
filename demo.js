var BiString = bistring.BiString;

const code = document.getElementById("code");
const update = document.getElementById("update");
const original = document.getElementById("original");
const modified = document.getElementById("modified");
let bs;

function updateCode() {
    try {
        const func = new Function(code.value);
        bs = BiString.from(func());
    } catch (error) {
        console.log(error);
        bs = new BiString(error.name + ": " + error.message);
    }

    original.textContent = bs.original;
    modified.textContent = bs.modified;
}

code.addEventListener("input", updateCode);
updateCode();

function fakeSelection(node, str, start, end) {
    while (node.firstChild) {
        node.firstChild.remove();
    }

    const prefix = str.slice(0, start);
    node.appendChild(document.createTextNode(prefix));

    const infix = str.slice(start, end);
    const span = document.createElement("span");
    span.style.background = "Highlight";
    span.style.color = "HighlightText";
    span.textContent = infix;
    node.appendChild(span);

    const suffix = str.slice(end);
    node.appendChild(document.createTextNode(suffix));
}

function deselect() {
    if (original.childNodes.length !== 1) {
        original.textContent = bs.original;
    }
    if (modified.childNodes.length !== 1) {
        modified.textContent = bs.modified;
    }
}

function updateSelection() {
    const selection = window.getSelection();
    if (selection.rangeCount < 1) {
        deselect();
        return;
    }

    const range = selection.getRangeAt(0);
    if (range.collapsed) {
        deselect();
        return;
    }

    const container = range.startContainer;
    if (range.endContainer !== container) {
        deselect();
        return;
    }

    const start = Math.min(range.startOffset, range.endOffset);
    const end = Math.max(range.startOffset, range.endOffset);

    const originalText = original.childNodes[0];
    const modifiedText = modified.childNodes[0];
    if (container === originalText) {
        fakeSelection(modified, bs.modified, ...bs.alignment.modifiedBounds(start, end));
    } else if (container === modifiedText) {
        fakeSelection(original, bs.original, ...bs.alignment.originalBounds(start, end));
    } else {
        deselect();
    }
}

document.addEventListener("selectionchange", updateSelection);
updateSelection();
