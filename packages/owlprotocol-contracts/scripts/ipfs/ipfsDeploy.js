"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
exports.__esModule = true;
//@ts-nocheck
var ipfs_http_client_1 = require("ipfs-http-client");
var fs_1 = require("fs");
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var client, imagePaths, i, path, data, res, s, res_1, res_1_1, a, e_1_1;
    var e_1, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                client = (0, ipfs_http_client_1.create)({ url: "/ip4/127.0.0.1/tcp/5002/http" });
                imagePaths = [];
                i = 0;
                _b.label = 1;
            case 1:
                if (!(i < 10)) return [3 /*break*/, 4];
                return [4 /*yield*/, client.add((0, fs_1.readFileSync)(__dirname + "/metadata/" + i + "/image.png"))];
            case 2:
                path = (_b.sent()).path;
                imagePaths.push(path);
                _b.label = 3;
            case 3:
                i++;
                return [3 /*break*/, 1];
            case 4:
                console.log(imagePaths);
                data = imagePaths.map(function (e, i) { return { path: i + ".json", content: JSON.stringify(__assign({ image: "ipfs://" + e }, JSON.parse((0, fs_1.readFileSync)(__dirname + "/metadata/" + i + "/attributes.json").toString()))) }; });
                res = client.addAll(data, { wrapWithDirectory: true });
                s = [];
                _b.label = 5;
            case 5:
                _b.trys.push([5, 10, 11, 16]);
                res_1 = __asyncValues(res);
                _b.label = 6;
            case 6: return [4 /*yield*/, res_1.next()];
            case 7:
                if (!(res_1_1 = _b.sent(), !res_1_1.done)) return [3 /*break*/, 9];
                a = res_1_1.value;
                s.push(a);
                _b.label = 8;
            case 8: return [3 /*break*/, 6];
            case 9: return [3 /*break*/, 16];
            case 10:
                e_1_1 = _b.sent();
                e_1 = { error: e_1_1 };
                return [3 /*break*/, 16];
            case 11:
                _b.trys.push([11, , 14, 15]);
                if (!(res_1_1 && !res_1_1.done && (_a = res_1["return"]))) return [3 /*break*/, 13];
                return [4 /*yield*/, _a.call(res_1)];
            case 12:
                _b.sent();
                _b.label = 13;
            case 13: return [3 /*break*/, 15];
            case 14:
                if (e_1) throw e_1.error;
                return [7 /*endfinally*/];
            case 15: return [7 /*endfinally*/];
            case 16:
                console.log("Cid is " + (s[s.length - 1]).cid);
                return [2 /*return*/];
        }
    });
}); })();
