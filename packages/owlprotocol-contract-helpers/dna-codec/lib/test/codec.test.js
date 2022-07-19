"use strict";
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
var ethers_1 = require("ethers");
var chai_1 = require("chai");
var __1 = require("..");
var toBN = ethers_1.BigNumber.from;
describe('codec.ts', function () {
    var _this = this;
    describe('Low-level codec', function () {
        it('Encode/decode values', function () { return __awaiter(_this, void 0, void 0, function () {
            var values, genePositions, encodedDna, decodedDna, valueIdx;
            return __generator(this, function (_a) {
                values = [toBN(255), toBN(65535), toBN(0), toBN(1), toBN(100000)];
                genePositions = [0, 8, 24, 32, 40];
                encodedDna = (0, __1.encodeGenesUint256)(values, genePositions);
                decodedDna = (0, __1.decodeGenesUint256)(encodedDna, genePositions);
                // Compare before/after
                for (valueIdx = 0; valueIdx < values.length; valueIdx++)
                    (0, chai_1.assert)(decodedDna[valueIdx].eq(values[valueIdx]), "values at index ".concat(valueIdx, " not equal!"));
                return [2 /*return*/];
            });
        }); });
        it('Test overflows values', function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Encode the following values:
                (0, __1.encodeGenesUint256)([255, 0], [0, 8]);
                (0, chai_1.expect)(function () { return (0, __1.encodeGenesUint256)([256, 0], [0, 8]); }).to["throw"]();
                // Test the end spacing
                (0, __1.encodeGenesUint256)([0, toBN(2).pow(toBN(128)).sub(1)], [0, 128]);
                (0, chai_1.expect)(function () { return (0, __1.encodeGenesUint256)([0, toBN(2).pow(toBN(128))], [0, 128]); }).to["throw"]();
                return [2 /*return*/];
            });
        }); });
    });
    describe('Simplified codec', function () {
        var dna;
        // Test encode values
        var genes = [
            {
                maxValue: 1000,
                name: 'test'
            },
            {
                maxValue: 2000000,
                name: 'other'
            },
        ];
        var lowLevelDecode = [0, 10]; // boundaries to call decodeUint256
        var genDummyValues = function () { return genes.map(function (v) { return ethers_1.BigNumber.from(v.maxValue).sub(1); }); };
        it('simpleEncoder(...)', function () { return __awaiter(_this, void 0, void 0, function () {
            var dummyValues, dna2;
            return __generator(this, function (_a) {
                dummyValues = genDummyValues();
                dna = (0, __1.simpleEncoder)(genes, dummyValues);
                dna2 = (0, __1.encodeGenesUint256)(dummyValues, lowLevelDecode);
                (0, chai_1.expect)(dna.eq(dna2), 'encodings not equal!');
                return [2 /*return*/];
            });
        }); });
        it('simpleEncoder(...) over max values', function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                (0, chai_1.expect)(function () { return (0, __1.simpleEncoder)(genes, [2000, 100]); }).to["throw"]();
                return [2 /*return*/];
            });
        }); });
        it('simpleEncoder(...) bad lengths', function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                (0, chai_1.expect)(function () { return (0, __1.simpleEncoder)(genes, [100, 100, 100]); }).to["throw"]();
                return [2 /*return*/];
            });
        }); });
        it('simpleEncoder(...) not enough storage', function () { return __awaiter(_this, void 0, void 0, function () {
            var genesCustom;
            return __generator(this, function (_a) {
                genesCustom = __spreadArray(__spreadArray([], genes, true), [
                    {
                        maxValue: ethers_1.BigNumber.from(2).pow(256).sub(1),
                        name: 'maxUint'
                    },
                ], false);
                (0, chai_1.expect)(function () { return (0, __1.simpleEncoder)(genesCustom, [100, 100, 100]); }).to["throw"]();
                return [2 /*return*/];
            });
        }); });
        it('simpleEncoder(...) default naming', function () { return __awaiter(_this, void 0, void 0, function () {
            var genesCustom, decoded;
            return __generator(this, function (_a) {
                genesCustom = genes;
                //@ts-ignore
                genes[1] = {
                    maxValue: 250
                };
                decoded = (0, __1.simpleDecoder)(genesCustom, dna);
                (0, chai_1.expect)(decoded['1'].eq(250));
                return [2 /*return*/];
            });
        }); });
        it('simpleDecoder(...)', function () { return __awaiter(_this, void 0, void 0, function () {
            var decoded, decoded2, i;
            return __generator(this, function (_a) {
                decoded = Object.values((0, __1.simpleDecoder)(genes, dna));
                decoded2 = (0, __1.decodeGenesUint256)(dna, lowLevelDecode);
                for (i = 0; i < decoded.length; i++) {
                    (0, chai_1.expect)(decoded[i].eq(decoded2[i]), "decoded @".concat(i, " wrong!"));
                }
                return [2 /*return*/];
            });
        }); });
    });
});
