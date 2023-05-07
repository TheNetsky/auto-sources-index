"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = void 0;
const express_1 = __importDefault(require("express"));
function startServer() {
    const app = (0, express_1.default)();
    app.get("/", (req, res) => {
        console.log(new Date().toString() + 'Ping Received');
        res.status(200).send('Updating source index...');
    });
    app.listen(process.env.PORT);
}
exports.startServer = startServer;
//# sourceMappingURL=Express.js.map