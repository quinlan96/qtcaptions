var __create = Object.create;
var __defProp = Object.defineProperty;
var __getProtoOf = Object.getPrototypeOf;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};

// node_modules/sdp/sdp.js
var require_sdp = __commonJS((exports, module) => {
  var SDPUtils = {};
  SDPUtils.generateIdentifier = function() {
    return Math.random().toString(36).substr(2, 10);
  };
  SDPUtils.localCName = SDPUtils.generateIdentifier();
  SDPUtils.splitLines = function(blob) {
    return blob.trim().split("\n").map(function(line) {
      return line.trim();
    });
  };
  SDPUtils.splitSections = function(blob) {
    var parts = blob.split("\nm=");
    return parts.map(function(part, index) {
      return (index > 0 ? "m=" + part : part).trim() + "\r\n";
    });
  };
  SDPUtils.getDescription = function(blob) {
    var sections = SDPUtils.splitSections(blob);
    return sections && sections[0];
  };
  SDPUtils.getMediaSections = function(blob) {
    var sections = SDPUtils.splitSections(blob);
    sections.shift();
    return sections;
  };
  SDPUtils.matchPrefix = function(blob, prefix) {
    return SDPUtils.splitLines(blob).filter(function(line) {
      return line.indexOf(prefix) === 0;
    });
  };
  SDPUtils.parseCandidate = function(line) {
    var parts;
    if (line.indexOf("a=candidate:") === 0) {
      parts = line.substring(12).split(" ");
    } else {
      parts = line.substring(10).split(" ");
    }
    var candidate = {
      foundation: parts[0],
      component: parseInt(parts[1], 10),
      protocol: parts[2].toLowerCase(),
      priority: parseInt(parts[3], 10),
      ip: parts[4],
      address: parts[4],
      port: parseInt(parts[5], 10),
      type: parts[7]
    };
    for (var i = 8;i < parts.length; i += 2) {
      switch (parts[i]) {
        case "raddr":
          candidate.relatedAddress = parts[i + 1];
          break;
        case "rport":
          candidate.relatedPort = parseInt(parts[i + 1], 10);
          break;
        case "tcptype":
          candidate.tcpType = parts[i + 1];
          break;
        case "ufrag":
          candidate.ufrag = parts[i + 1];
          candidate.usernameFragment = parts[i + 1];
          break;
        default:
          candidate[parts[i]] = parts[i + 1];
          break;
      }
    }
    return candidate;
  };
  SDPUtils.writeCandidate = function(candidate) {
    var sdp = [];
    sdp.push(candidate.foundation);
    sdp.push(candidate.component);
    sdp.push(candidate.protocol.toUpperCase());
    sdp.push(candidate.priority);
    sdp.push(candidate.address || candidate.ip);
    sdp.push(candidate.port);
    var type = candidate.type;
    sdp.push("typ");
    sdp.push(type);
    if (type !== "host" && candidate.relatedAddress && candidate.relatedPort) {
      sdp.push("raddr");
      sdp.push(candidate.relatedAddress);
      sdp.push("rport");
      sdp.push(candidate.relatedPort);
    }
    if (candidate.tcpType && candidate.protocol.toLowerCase() === "tcp") {
      sdp.push("tcptype");
      sdp.push(candidate.tcpType);
    }
    if (candidate.usernameFragment || candidate.ufrag) {
      sdp.push("ufrag");
      sdp.push(candidate.usernameFragment || candidate.ufrag);
    }
    return "candidate:" + sdp.join(" ");
  };
  SDPUtils.parseIceOptions = function(line) {
    return line.substr(14).split(" ");
  };
  SDPUtils.parseRtpMap = function(line) {
    var parts = line.substr(9).split(" ");
    var parsed = {
      payloadType: parseInt(parts.shift(), 10)
    };
    parts = parts[0].split("/");
    parsed.name = parts[0];
    parsed.clockRate = parseInt(parts[1], 10);
    parsed.channels = parts.length === 3 ? parseInt(parts[2], 10) : 1;
    parsed.numChannels = parsed.channels;
    return parsed;
  };
  SDPUtils.writeRtpMap = function(codec) {
    var pt = codec.payloadType;
    if (codec.preferredPayloadType !== undefined) {
      pt = codec.preferredPayloadType;
    }
    var channels = codec.channels || codec.numChannels || 1;
    return "a=rtpmap:" + pt + " " + codec.name + "/" + codec.clockRate + (channels !== 1 ? "/" + channels : "") + "\r\n";
  };
  SDPUtils.parseExtmap = function(line) {
    var parts = line.substr(9).split(" ");
    return {
      id: parseInt(parts[0], 10),
      direction: parts[0].indexOf("/") > 0 ? parts[0].split("/")[1] : "sendrecv",
      uri: parts[1]
    };
  };
  SDPUtils.writeExtmap = function(headerExtension) {
    return "a=extmap:" + (headerExtension.id || headerExtension.preferredId) + (headerExtension.direction && headerExtension.direction !== "sendrecv" ? "/" + headerExtension.direction : "") + " " + headerExtension.uri + "\r\n";
  };
  SDPUtils.parseFmtp = function(line) {
    var parsed = {};
    var kv;
    var parts = line.substr(line.indexOf(" ") + 1).split(";");
    for (var j = 0;j < parts.length; j++) {
      kv = parts[j].trim().split("=");
      parsed[kv[0].trim()] = kv[1];
    }
    return parsed;
  };
  SDPUtils.writeFmtp = function(codec) {
    var line = "";
    var pt = codec.payloadType;
    if (codec.preferredPayloadType !== undefined) {
      pt = codec.preferredPayloadType;
    }
    if (codec.parameters && Object.keys(codec.parameters).length) {
      var params = [];
      Object.keys(codec.parameters).forEach(function(param) {
        if (codec.parameters[param]) {
          params.push(param + "=" + codec.parameters[param]);
        } else {
          params.push(param);
        }
      });
      line += "a=fmtp:" + pt + " " + params.join(";") + "\r\n";
    }
    return line;
  };
  SDPUtils.parseRtcpFb = function(line) {
    var parts = line.substr(line.indexOf(" ") + 1).split(" ");
    return {
      type: parts.shift(),
      parameter: parts.join(" ")
    };
  };
  SDPUtils.writeRtcpFb = function(codec) {
    var lines = "";
    var pt = codec.payloadType;
    if (codec.preferredPayloadType !== undefined) {
      pt = codec.preferredPayloadType;
    }
    if (codec.rtcpFeedback && codec.rtcpFeedback.length) {
      codec.rtcpFeedback.forEach(function(fb) {
        lines += "a=rtcp-fb:" + pt + " " + fb.type + (fb.parameter && fb.parameter.length ? " " + fb.parameter : "") + "\r\n";
      });
    }
    return lines;
  };
  SDPUtils.parseSsrcMedia = function(line) {
    var sp = line.indexOf(" ");
    var parts = {
      ssrc: parseInt(line.substr(7, sp - 7), 10)
    };
    var colon = line.indexOf(":", sp);
    if (colon > -1) {
      parts.attribute = line.substr(sp + 1, colon - sp - 1);
      parts.value = line.substr(colon + 1);
    } else {
      parts.attribute = line.substr(sp + 1);
    }
    return parts;
  };
  SDPUtils.parseSsrcGroup = function(line) {
    var parts = line.substr(13).split(" ");
    return {
      semantics: parts.shift(),
      ssrcs: parts.map(function(ssrc) {
        return parseInt(ssrc, 10);
      })
    };
  };
  SDPUtils.getMid = function(mediaSection) {
    var mid = SDPUtils.matchPrefix(mediaSection, "a=mid:")[0];
    if (mid) {
      return mid.substr(6);
    }
  };
  SDPUtils.parseFingerprint = function(line) {
    var parts = line.substr(14).split(" ");
    return {
      algorithm: parts[0].toLowerCase(),
      value: parts[1]
    };
  };
  SDPUtils.getDtlsParameters = function(mediaSection, sessionpart) {
    var lines = SDPUtils.matchPrefix(mediaSection + sessionpart, "a=fingerprint:");
    return {
      role: "auto",
      fingerprints: lines.map(SDPUtils.parseFingerprint)
    };
  };
  SDPUtils.writeDtlsParameters = function(params, setupType) {
    var sdp = "a=setup:" + setupType + "\r\n";
    params.fingerprints.forEach(function(fp) {
      sdp += "a=fingerprint:" + fp.algorithm + " " + fp.value + "\r\n";
    });
    return sdp;
  };
  SDPUtils.parseCryptoLine = function(line) {
    var parts = line.substr(9).split(" ");
    return {
      tag: parseInt(parts[0], 10),
      cryptoSuite: parts[1],
      keyParams: parts[2],
      sessionParams: parts.slice(3)
    };
  };
  SDPUtils.writeCryptoLine = function(parameters) {
    return "a=crypto:" + parameters.tag + " " + parameters.cryptoSuite + " " + (typeof parameters.keyParams === "object" ? SDPUtils.writeCryptoKeyParams(parameters.keyParams) : parameters.keyParams) + (parameters.sessionParams ? " " + parameters.sessionParams.join(" ") : "") + "\r\n";
  };
  SDPUtils.parseCryptoKeyParams = function(keyParams) {
    if (keyParams.indexOf("inline:") !== 0) {
      return null;
    }
    var parts = keyParams.substr(7).split("|");
    return {
      keyMethod: "inline",
      keySalt: parts[0],
      lifeTime: parts[1],
      mkiValue: parts[2] ? parts[2].split(":")[0] : undefined,
      mkiLength: parts[2] ? parts[2].split(":")[1] : undefined
    };
  };
  SDPUtils.writeCryptoKeyParams = function(keyParams) {
    return keyParams.keyMethod + ":" + keyParams.keySalt + (keyParams.lifeTime ? "|" + keyParams.lifeTime : "") + (keyParams.mkiValue && keyParams.mkiLength ? "|" + keyParams.mkiValue + ":" + keyParams.mkiLength : "");
  };
  SDPUtils.getCryptoParameters = function(mediaSection, sessionpart) {
    var lines = SDPUtils.matchPrefix(mediaSection + sessionpart, "a=crypto:");
    return lines.map(SDPUtils.parseCryptoLine);
  };
  SDPUtils.getIceParameters = function(mediaSection, sessionpart) {
    var ufrag = SDPUtils.matchPrefix(mediaSection + sessionpart, "a=ice-ufrag:")[0];
    var pwd = SDPUtils.matchPrefix(mediaSection + sessionpart, "a=ice-pwd:")[0];
    if (!(ufrag && pwd)) {
      return null;
    }
    return {
      usernameFragment: ufrag.substr(12),
      password: pwd.substr(10)
    };
  };
  SDPUtils.writeIceParameters = function(params) {
    return "a=ice-ufrag:" + params.usernameFragment + "\r\n" + "a=ice-pwd:" + params.password + "\r\n";
  };
  SDPUtils.parseRtpParameters = function(mediaSection) {
    var description = {
      codecs: [],
      headerExtensions: [],
      fecMechanisms: [],
      rtcp: []
    };
    var lines = SDPUtils.splitLines(mediaSection);
    var mline = lines[0].split(" ");
    for (var i = 3;i < mline.length; i++) {
      var pt = mline[i];
      var rtpmapline = SDPUtils.matchPrefix(mediaSection, "a=rtpmap:" + pt + " ")[0];
      if (rtpmapline) {
        var codec = SDPUtils.parseRtpMap(rtpmapline);
        var fmtps = SDPUtils.matchPrefix(mediaSection, "a=fmtp:" + pt + " ");
        codec.parameters = fmtps.length ? SDPUtils.parseFmtp(fmtps[0]) : {};
        codec.rtcpFeedback = SDPUtils.matchPrefix(mediaSection, "a=rtcp-fb:" + pt + " ").map(SDPUtils.parseRtcpFb);
        description.codecs.push(codec);
        switch (codec.name.toUpperCase()) {
          case "RED":
          case "ULPFEC":
            description.fecMechanisms.push(codec.name.toUpperCase());
            break;
          default:
            break;
        }
      }
    }
    SDPUtils.matchPrefix(mediaSection, "a=extmap:").forEach(function(line) {
      description.headerExtensions.push(SDPUtils.parseExtmap(line));
    });
    return description;
  };
  SDPUtils.writeRtpDescription = function(kind, caps) {
    var sdp = "";
    sdp += "m=" + kind + " ";
    sdp += caps.codecs.length > 0 ? "9" : "0";
    sdp += " UDP/TLS/RTP/SAVPF ";
    sdp += caps.codecs.map(function(codec) {
      if (codec.preferredPayloadType !== undefined) {
        return codec.preferredPayloadType;
      }
      return codec.payloadType;
    }).join(" ") + "\r\n";
    sdp += "c=IN IP4 0.0.0.0\r\n";
    sdp += "a=rtcp:9 IN IP4 0.0.0.0\r\n";
    caps.codecs.forEach(function(codec) {
      sdp += SDPUtils.writeRtpMap(codec);
      sdp += SDPUtils.writeFmtp(codec);
      sdp += SDPUtils.writeRtcpFb(codec);
    });
    var maxptime = 0;
    caps.codecs.forEach(function(codec) {
      if (codec.maxptime > maxptime) {
        maxptime = codec.maxptime;
      }
    });
    if (maxptime > 0) {
      sdp += "a=maxptime:" + maxptime + "\r\n";
    }
    sdp += "a=rtcp-mux\r\n";
    if (caps.headerExtensions) {
      caps.headerExtensions.forEach(function(extension) {
        sdp += SDPUtils.writeExtmap(extension);
      });
    }
    return sdp;
  };
  SDPUtils.parseRtpEncodingParameters = function(mediaSection) {
    var encodingParameters = [];
    var description = SDPUtils.parseRtpParameters(mediaSection);
    var hasRed = description.fecMechanisms.indexOf("RED") !== -1;
    var hasUlpfec = description.fecMechanisms.indexOf("ULPFEC") !== -1;
    var ssrcs = SDPUtils.matchPrefix(mediaSection, "a=ssrc:").map(function(line) {
      return SDPUtils.parseSsrcMedia(line);
    }).filter(function(parts) {
      return parts.attribute === "cname";
    });
    var primarySsrc = ssrcs.length > 0 && ssrcs[0].ssrc;
    var secondarySsrc;
    var flows = SDPUtils.matchPrefix(mediaSection, "a=ssrc-group:FID").map(function(line) {
      var parts = line.substr(17).split(" ");
      return parts.map(function(part) {
        return parseInt(part, 10);
      });
    });
    if (flows.length > 0 && flows[0].length > 1 && flows[0][0] === primarySsrc) {
      secondarySsrc = flows[0][1];
    }
    description.codecs.forEach(function(codec) {
      if (codec.name.toUpperCase() === "RTX" && codec.parameters.apt) {
        var encParam = {
          ssrc: primarySsrc,
          codecPayloadType: parseInt(codec.parameters.apt, 10)
        };
        if (primarySsrc && secondarySsrc) {
          encParam.rtx = { ssrc: secondarySsrc };
        }
        encodingParameters.push(encParam);
        if (hasRed) {
          encParam = JSON.parse(JSON.stringify(encParam));
          encParam.fec = {
            ssrc: primarySsrc,
            mechanism: hasUlpfec ? "red+ulpfec" : "red"
          };
          encodingParameters.push(encParam);
        }
      }
    });
    if (encodingParameters.length === 0 && primarySsrc) {
      encodingParameters.push({
        ssrc: primarySsrc
      });
    }
    var bandwidth = SDPUtils.matchPrefix(mediaSection, "b=");
    if (bandwidth.length) {
      if (bandwidth[0].indexOf("b=TIAS:") === 0) {
        bandwidth = parseInt(bandwidth[0].substr(7), 10);
      } else if (bandwidth[0].indexOf("b=AS:") === 0) {
        bandwidth = parseInt(bandwidth[0].substr(5), 10) * 1000 * 0.95 - 50 * 40 * 8;
      } else {
        bandwidth = undefined;
      }
      encodingParameters.forEach(function(params) {
        params.maxBitrate = bandwidth;
      });
    }
    return encodingParameters;
  };
  SDPUtils.parseRtcpParameters = function(mediaSection) {
    var rtcpParameters = {};
    var remoteSsrc = SDPUtils.matchPrefix(mediaSection, "a=ssrc:").map(function(line) {
      return SDPUtils.parseSsrcMedia(line);
    }).filter(function(obj) {
      return obj.attribute === "cname";
    })[0];
    if (remoteSsrc) {
      rtcpParameters.cname = remoteSsrc.value;
      rtcpParameters.ssrc = remoteSsrc.ssrc;
    }
    var rsize = SDPUtils.matchPrefix(mediaSection, "a=rtcp-rsize");
    rtcpParameters.reducedSize = rsize.length > 0;
    rtcpParameters.compound = rsize.length === 0;
    var mux = SDPUtils.matchPrefix(mediaSection, "a=rtcp-mux");
    rtcpParameters.mux = mux.length > 0;
    return rtcpParameters;
  };
  SDPUtils.parseMsid = function(mediaSection) {
    var parts;
    var spec = SDPUtils.matchPrefix(mediaSection, "a=msid:");
    if (spec.length === 1) {
      parts = spec[0].substr(7).split(" ");
      return { stream: parts[0], track: parts[1] };
    }
    var planB = SDPUtils.matchPrefix(mediaSection, "a=ssrc:").map(function(line) {
      return SDPUtils.parseSsrcMedia(line);
    }).filter(function(msidParts) {
      return msidParts.attribute === "msid";
    });
    if (planB.length > 0) {
      parts = planB[0].value.split(" ");
      return { stream: parts[0], track: parts[1] };
    }
  };
  SDPUtils.parseSctpDescription = function(mediaSection) {
    var mline = SDPUtils.parseMLine(mediaSection);
    var maxSizeLine = SDPUtils.matchPrefix(mediaSection, "a=max-message-size:");
    var maxMessageSize;
    if (maxSizeLine.length > 0) {
      maxMessageSize = parseInt(maxSizeLine[0].substr(19), 10);
    }
    if (isNaN(maxMessageSize)) {
      maxMessageSize = 65536;
    }
    var sctpPort = SDPUtils.matchPrefix(mediaSection, "a=sctp-port:");
    if (sctpPort.length > 0) {
      return {
        port: parseInt(sctpPort[0].substr(12), 10),
        protocol: mline.fmt,
        maxMessageSize
      };
    }
    var sctpMapLines = SDPUtils.matchPrefix(mediaSection, "a=sctpmap:");
    if (sctpMapLines.length > 0) {
      var parts = SDPUtils.matchPrefix(mediaSection, "a=sctpmap:")[0].substr(10).split(" ");
      return {
        port: parseInt(parts[0], 10),
        protocol: parts[1],
        maxMessageSize
      };
    }
  };
  SDPUtils.writeSctpDescription = function(media, sctp) {
    var output = [];
    if (media.protocol !== "DTLS/SCTP") {
      output = [
        "m=" + media.kind + " 9 " + media.protocol + " " + sctp.protocol + "\r\n",
        "c=IN IP4 0.0.0.0\r\n",
        "a=sctp-port:" + sctp.port + "\r\n"
      ];
    } else {
      output = [
        "m=" + media.kind + " 9 " + media.protocol + " " + sctp.port + "\r\n",
        "c=IN IP4 0.0.0.0\r\n",
        "a=sctpmap:" + sctp.port + " " + sctp.protocol + " 65535\r\n"
      ];
    }
    if (sctp.maxMessageSize !== undefined) {
      output.push("a=max-message-size:" + sctp.maxMessageSize + "\r\n");
    }
    return output.join("");
  };
  SDPUtils.generateSessionId = function() {
    return Math.random().toString().substr(2, 21);
  };
  SDPUtils.writeSessionBoilerplate = function(sessId, sessVer, sessUser) {
    var sessionId;
    var version = sessVer !== undefined ? sessVer : 2;
    if (sessId) {
      sessionId = sessId;
    } else {
      sessionId = SDPUtils.generateSessionId();
    }
    var user = sessUser || "thisisadapterortc";
    return "v=0\r\n" + "o=" + user + " " + sessionId + " " + version + " IN IP4 127.0.0.1\r\n" + "s=-\r\n" + "t=0 0\r\n";
  };
  SDPUtils.writeMediaSection = function(transceiver, caps, type, stream) {
    var sdp = SDPUtils.writeRtpDescription(transceiver.kind, caps);
    sdp += SDPUtils.writeIceParameters(transceiver.iceGatherer.getLocalParameters());
    sdp += SDPUtils.writeDtlsParameters(transceiver.dtlsTransport.getLocalParameters(), type === "offer" ? "actpass" : "active");
    sdp += "a=mid:" + transceiver.mid + "\r\n";
    if (transceiver.direction) {
      sdp += "a=" + transceiver.direction + "\r\n";
    } else if (transceiver.rtpSender && transceiver.rtpReceiver) {
      sdp += "a=sendrecv\r\n";
    } else if (transceiver.rtpSender) {
      sdp += "a=sendonly\r\n";
    } else if (transceiver.rtpReceiver) {
      sdp += "a=recvonly\r\n";
    } else {
      sdp += "a=inactive\r\n";
    }
    if (transceiver.rtpSender) {
      var msid = "msid:" + stream.id + " " + transceiver.rtpSender.track.id + "\r\n";
      sdp += "a=" + msid;
      sdp += "a=ssrc:" + transceiver.sendEncodingParameters[0].ssrc + " " + msid;
      if (transceiver.sendEncodingParameters[0].rtx) {
        sdp += "a=ssrc:" + transceiver.sendEncodingParameters[0].rtx.ssrc + " " + msid;
        sdp += "a=ssrc-group:FID " + transceiver.sendEncodingParameters[0].ssrc + " " + transceiver.sendEncodingParameters[0].rtx.ssrc + "\r\n";
      }
    }
    sdp += "a=ssrc:" + transceiver.sendEncodingParameters[0].ssrc + " cname:" + SDPUtils.localCName + "\r\n";
    if (transceiver.rtpSender && transceiver.sendEncodingParameters[0].rtx) {
      sdp += "a=ssrc:" + transceiver.sendEncodingParameters[0].rtx.ssrc + " cname:" + SDPUtils.localCName + "\r\n";
    }
    return sdp;
  };
  SDPUtils.getDirection = function(mediaSection, sessionpart) {
    var lines = SDPUtils.splitLines(mediaSection);
    for (var i = 0;i < lines.length; i++) {
      switch (lines[i]) {
        case "a=sendrecv":
        case "a=sendonly":
        case "a=recvonly":
        case "a=inactive":
          return lines[i].substr(2);
        default:
      }
    }
    if (sessionpart) {
      return SDPUtils.getDirection(sessionpart);
    }
    return "sendrecv";
  };
  SDPUtils.getKind = function(mediaSection) {
    var lines = SDPUtils.splitLines(mediaSection);
    var mline = lines[0].split(" ");
    return mline[0].substr(2);
  };
  SDPUtils.isRejected = function(mediaSection) {
    return mediaSection.split(" ", 2)[1] === "0";
  };
  SDPUtils.parseMLine = function(mediaSection) {
    var lines = SDPUtils.splitLines(mediaSection);
    var parts = lines[0].substr(2).split(" ");
    return {
      kind: parts[0],
      port: parseInt(parts[1], 10),
      protocol: parts[2],
      fmt: parts.slice(3).join(" ")
    };
  };
  SDPUtils.parseOLine = function(mediaSection) {
    var line = SDPUtils.matchPrefix(mediaSection, "o=")[0];
    var parts = line.substr(2).split(" ");
    return {
      username: parts[0],
      sessionId: parts[1],
      sessionVersion: parseInt(parts[2], 10),
      netType: parts[3],
      addressType: parts[4],
      address: parts[5]
    };
  };
  SDPUtils.isValidSDP = function(blob) {
    if (typeof blob !== "string" || blob.length === 0) {
      return false;
    }
    var lines = SDPUtils.splitLines(blob);
    for (var i = 0;i < lines.length; i++) {
      if (lines[i].length < 2 || lines[i].charAt(1) !== "=") {
        return false;
      }
    }
    return true;
  };
  if (typeof module === "object") {
    module.exports = SDPUtils;
  }
});

// node_modules/rtcpeerconnection-shim/rtcpeerconnection.js
var require_rtcpeerconnection = __commonJS((exports, module) => {
  var fixStatsType = function(stat) {
    return {
      inboundrtp: "inbound-rtp",
      outboundrtp: "outbound-rtp",
      candidatepair: "candidate-pair",
      localcandidate: "local-candidate",
      remotecandidate: "remote-candidate"
    }[stat.type] || stat.type;
  };
  var writeMediaSection = function(transceiver, caps, type, stream, dtlsRole) {
    var sdp = SDPUtils.writeRtpDescription(transceiver.kind, caps);
    sdp += SDPUtils.writeIceParameters(transceiver.iceGatherer.getLocalParameters());
    sdp += SDPUtils.writeDtlsParameters(transceiver.dtlsTransport.getLocalParameters(), type === "offer" ? "actpass" : dtlsRole || "active");
    sdp += "a=mid:" + transceiver.mid + "\r\n";
    if (transceiver.rtpSender && transceiver.rtpReceiver) {
      sdp += "a=sendrecv\r\n";
    } else if (transceiver.rtpSender) {
      sdp += "a=sendonly\r\n";
    } else if (transceiver.rtpReceiver) {
      sdp += "a=recvonly\r\n";
    } else {
      sdp += "a=inactive\r\n";
    }
    if (transceiver.rtpSender) {
      var trackId = transceiver.rtpSender._initialTrackId || transceiver.rtpSender.track.id;
      transceiver.rtpSender._initialTrackId = trackId;
      var msid = "msid:" + (stream ? stream.id : "-") + " " + trackId + "\r\n";
      sdp += "a=" + msid;
      sdp += "a=ssrc:" + transceiver.sendEncodingParameters[0].ssrc + " " + msid;
      if (transceiver.sendEncodingParameters[0].rtx) {
        sdp += "a=ssrc:" + transceiver.sendEncodingParameters[0].rtx.ssrc + " " + msid;
        sdp += "a=ssrc-group:FID " + transceiver.sendEncodingParameters[0].ssrc + " " + transceiver.sendEncodingParameters[0].rtx.ssrc + "\r\n";
      }
    }
    sdp += "a=ssrc:" + transceiver.sendEncodingParameters[0].ssrc + " cname:" + SDPUtils.localCName + "\r\n";
    if (transceiver.rtpSender && transceiver.sendEncodingParameters[0].rtx) {
      sdp += "a=ssrc:" + transceiver.sendEncodingParameters[0].rtx.ssrc + " cname:" + SDPUtils.localCName + "\r\n";
    }
    return sdp;
  };
  var filterIceServers2 = function(iceServers, edgeVersion) {
    var hasTurn = false;
    iceServers = JSON.parse(JSON.stringify(iceServers));
    return iceServers.filter(function(server) {
      if (server && (server.urls || server.url)) {
        var urls = server.urls || server.url;
        if (server.url && !server.urls) {
          console.warn("RTCIceServer.url is deprecated! Use urls instead.");
        }
        var isString = typeof urls === "string";
        if (isString) {
          urls = [urls];
        }
        urls = urls.filter(function(url) {
          var validTurn = url.indexOf("turn:") === 0 && url.indexOf("transport=udp") !== -1 && url.indexOf("turn:[") === -1 && !hasTurn;
          if (validTurn) {
            hasTurn = true;
            return true;
          }
          return url.indexOf("stun:") === 0 && edgeVersion >= 14393 && url.indexOf("?transport=udp") === -1;
        });
        delete server.url;
        server.urls = isString ? urls[0] : urls;
        return !!urls.length;
      }
    });
  };
  var getCommonCapabilities = function(localCapabilities, remoteCapabilities) {
    var commonCapabilities = {
      codecs: [],
      headerExtensions: [],
      fecMechanisms: []
    };
    var findCodecByPayloadType = function(pt, codecs) {
      pt = parseInt(pt, 10);
      for (var i = 0;i < codecs.length; i++) {
        if (codecs[i].payloadType === pt || codecs[i].preferredPayloadType === pt) {
          return codecs[i];
        }
      }
    };
    var rtxCapabilityMatches = function(lRtx, rRtx, lCodecs, rCodecs) {
      var lCodec = findCodecByPayloadType(lRtx.parameters.apt, lCodecs);
      var rCodec = findCodecByPayloadType(rRtx.parameters.apt, rCodecs);
      return lCodec && rCodec && lCodec.name.toLowerCase() === rCodec.name.toLowerCase();
    };
    localCapabilities.codecs.forEach(function(lCodec) {
      for (var i = 0;i < remoteCapabilities.codecs.length; i++) {
        var rCodec = remoteCapabilities.codecs[i];
        if (lCodec.name.toLowerCase() === rCodec.name.toLowerCase() && lCodec.clockRate === rCodec.clockRate) {
          if (lCodec.name.toLowerCase() === "rtx" && lCodec.parameters && rCodec.parameters.apt) {
            if (!rtxCapabilityMatches(lCodec, rCodec, localCapabilities.codecs, remoteCapabilities.codecs)) {
              continue;
            }
          }
          rCodec = JSON.parse(JSON.stringify(rCodec));
          rCodec.numChannels = Math.min(lCodec.numChannels, rCodec.numChannels);
          commonCapabilities.codecs.push(rCodec);
          rCodec.rtcpFeedback = rCodec.rtcpFeedback.filter(function(fb) {
            for (var j = 0;j < lCodec.rtcpFeedback.length; j++) {
              if (lCodec.rtcpFeedback[j].type === fb.type && lCodec.rtcpFeedback[j].parameter === fb.parameter) {
                return true;
              }
            }
            return false;
          });
          break;
        }
      }
    });
    localCapabilities.headerExtensions.forEach(function(lHeaderExtension) {
      for (var i = 0;i < remoteCapabilities.headerExtensions.length; i++) {
        var rHeaderExtension = remoteCapabilities.headerExtensions[i];
        if (lHeaderExtension.uri === rHeaderExtension.uri) {
          commonCapabilities.headerExtensions.push(rHeaderExtension);
          break;
        }
      }
    });
    return commonCapabilities;
  };
  var isActionAllowedInSignalingState = function(action, type, signalingState) {
    return {
      offer: {
        setLocalDescription: ["stable", "have-local-offer"],
        setRemoteDescription: ["stable", "have-remote-offer"]
      },
      answer: {
        setLocalDescription: ["have-remote-offer", "have-local-pranswer"],
        setRemoteDescription: ["have-local-offer", "have-remote-pranswer"]
      }
    }[type][action].indexOf(signalingState) !== -1;
  };
  var maybeAddCandidate = function(iceTransport, candidate) {
    var alreadyAdded = iceTransport.getRemoteCandidates().find(function(remoteCandidate) {
      return candidate.foundation === remoteCandidate.foundation && candidate.ip === remoteCandidate.ip && candidate.port === remoteCandidate.port && candidate.priority === remoteCandidate.priority && candidate.protocol === remoteCandidate.protocol && candidate.type === remoteCandidate.type;
    });
    if (!alreadyAdded) {
      iceTransport.addRemoteCandidate(candidate);
    }
    return !alreadyAdded;
  };
  var makeError = function(name, description) {
    var e = new Error(description);
    e.name = name;
    e.code = {
      NotSupportedError: 9,
      InvalidStateError: 11,
      InvalidAccessError: 15,
      TypeError: undefined,
      OperationError: undefined
    }[name];
    return e;
  };
  var SDPUtils = require_sdp();
  module.exports = function(window2, edgeVersion) {
    function addTrackToStreamAndFireEvent(track, stream) {
      stream.addTrack(track);
      stream.dispatchEvent(new window2.MediaStreamTrackEvent("addtrack", { track }));
    }
    function removeTrackFromStreamAndFireEvent(track, stream) {
      stream.removeTrack(track);
      stream.dispatchEvent(new window2.MediaStreamTrackEvent("removetrack", { track }));
    }
    function fireAddTrack(pc, track, receiver, streams) {
      var trackEvent = new Event("track");
      trackEvent.track = track;
      trackEvent.receiver = receiver;
      trackEvent.transceiver = { receiver };
      trackEvent.streams = streams;
      window2.setTimeout(function() {
        pc._dispatchEvent("track", trackEvent);
      });
    }
    var RTCPeerConnection2 = function(config) {
      var pc = this;
      var _eventTarget = document.createDocumentFragment();
      ["addEventListener", "removeEventListener", "dispatchEvent"].forEach(function(method) {
        pc[method] = _eventTarget[method].bind(_eventTarget);
      });
      this.canTrickleIceCandidates = null;
      this.needNegotiation = false;
      this.localStreams = [];
      this.remoteStreams = [];
      this._localDescription = null;
      this._remoteDescription = null;
      this.signalingState = "stable";
      this.iceConnectionState = "new";
      this.connectionState = "new";
      this.iceGatheringState = "new";
      config = JSON.parse(JSON.stringify(config || {}));
      this.usingBundle = config.bundlePolicy === "max-bundle";
      if (config.rtcpMuxPolicy === "negotiate") {
        throw makeError("NotSupportedError", "rtcpMuxPolicy \'negotiate\' is not supported");
      } else if (!config.rtcpMuxPolicy) {
        config.rtcpMuxPolicy = "require";
      }
      switch (config.iceTransportPolicy) {
        case "all":
        case "relay":
          break;
        default:
          config.iceTransportPolicy = "all";
          break;
      }
      switch (config.bundlePolicy) {
        case "balanced":
        case "max-compat":
        case "max-bundle":
          break;
        default:
          config.bundlePolicy = "balanced";
          break;
      }
      config.iceServers = filterIceServers2(config.iceServers || [], edgeVersion);
      this._iceGatherers = [];
      if (config.iceCandidatePoolSize) {
        for (var i = config.iceCandidatePoolSize;i > 0; i--) {
          this._iceGatherers.push(new window2.RTCIceGatherer({
            iceServers: config.iceServers,
            gatherPolicy: config.iceTransportPolicy
          }));
        }
      } else {
        config.iceCandidatePoolSize = 0;
      }
      this._config = config;
      this.transceivers = [];
      this._sdpSessionId = SDPUtils.generateSessionId();
      this._sdpSessionVersion = 0;
      this._dtlsRole = undefined;
      this._isClosed = false;
    };
    Object.defineProperty(RTCPeerConnection2.prototype, "localDescription", {
      configurable: true,
      get: function() {
        return this._localDescription;
      }
    });
    Object.defineProperty(RTCPeerConnection2.prototype, "remoteDescription", {
      configurable: true,
      get: function() {
        return this._remoteDescription;
      }
    });
    RTCPeerConnection2.prototype.onicecandidate = null;
    RTCPeerConnection2.prototype.onaddstream = null;
    RTCPeerConnection2.prototype.ontrack = null;
    RTCPeerConnection2.prototype.onremovestream = null;
    RTCPeerConnection2.prototype.onsignalingstatechange = null;
    RTCPeerConnection2.prototype.oniceconnectionstatechange = null;
    RTCPeerConnection2.prototype.onconnectionstatechange = null;
    RTCPeerConnection2.prototype.onicegatheringstatechange = null;
    RTCPeerConnection2.prototype.onnegotiationneeded = null;
    RTCPeerConnection2.prototype.ondatachannel = null;
    RTCPeerConnection2.prototype._dispatchEvent = function(name, event) {
      if (this._isClosed) {
        return;
      }
      this.dispatchEvent(event);
      if (typeof this["on" + name] === "function") {
        this["on" + name](event);
      }
    };
    RTCPeerConnection2.prototype._emitGatheringStateChange = function() {
      var event = new Event("icegatheringstatechange");
      this._dispatchEvent("icegatheringstatechange", event);
    };
    RTCPeerConnection2.prototype.getConfiguration = function() {
      return this._config;
    };
    RTCPeerConnection2.prototype.getLocalStreams = function() {
      return this.localStreams;
    };
    RTCPeerConnection2.prototype.getRemoteStreams = function() {
      return this.remoteStreams;
    };
    RTCPeerConnection2.prototype._createTransceiver = function(kind, doNotAdd) {
      var hasBundleTransport = this.transceivers.length > 0;
      var transceiver = {
        track: null,
        iceGatherer: null,
        iceTransport: null,
        dtlsTransport: null,
        localCapabilities: null,
        remoteCapabilities: null,
        rtpSender: null,
        rtpReceiver: null,
        kind,
        mid: null,
        sendEncodingParameters: null,
        recvEncodingParameters: null,
        stream: null,
        associatedRemoteMediaStreams: [],
        wantReceive: true
      };
      if (this.usingBundle && hasBundleTransport) {
        transceiver.iceTransport = this.transceivers[0].iceTransport;
        transceiver.dtlsTransport = this.transceivers[0].dtlsTransport;
      } else {
        var transports = this._createIceAndDtlsTransports();
        transceiver.iceTransport = transports.iceTransport;
        transceiver.dtlsTransport = transports.dtlsTransport;
      }
      if (!doNotAdd) {
        this.transceivers.push(transceiver);
      }
      return transceiver;
    };
    RTCPeerConnection2.prototype.addTrack = function(track, stream) {
      if (this._isClosed) {
        throw makeError("InvalidStateError", "Attempted to call addTrack on a closed peerconnection.");
      }
      var alreadyExists = this.transceivers.find(function(s) {
        return s.track === track;
      });
      if (alreadyExists) {
        throw makeError("InvalidAccessError", "Track already exists.");
      }
      var transceiver;
      for (var i = 0;i < this.transceivers.length; i++) {
        if (!this.transceivers[i].track && this.transceivers[i].kind === track.kind) {
          transceiver = this.transceivers[i];
        }
      }
      if (!transceiver) {
        transceiver = this._createTransceiver(track.kind);
      }
      this._maybeFireNegotiationNeeded();
      if (this.localStreams.indexOf(stream) === -1) {
        this.localStreams.push(stream);
      }
      transceiver.track = track;
      transceiver.stream = stream;
      transceiver.rtpSender = new window2.RTCRtpSender(track, transceiver.dtlsTransport);
      return transceiver.rtpSender;
    };
    RTCPeerConnection2.prototype.addStream = function(stream) {
      var pc = this;
      if (edgeVersion >= 15025) {
        stream.getTracks().forEach(function(track) {
          pc.addTrack(track, stream);
        });
      } else {
        var clonedStream = stream.clone();
        stream.getTracks().forEach(function(track, idx) {
          var clonedTrack = clonedStream.getTracks()[idx];
          track.addEventListener("enabled", function(event) {
            clonedTrack.enabled = event.enabled;
          });
        });
        clonedStream.getTracks().forEach(function(track) {
          pc.addTrack(track, clonedStream);
        });
      }
    };
    RTCPeerConnection2.prototype.removeTrack = function(sender) {
      if (this._isClosed) {
        throw makeError("InvalidStateError", "Attempted to call removeTrack on a closed peerconnection.");
      }
      if (!(sender instanceof window2.RTCRtpSender)) {
        throw new TypeError("Argument 1 of RTCPeerConnection.removeTrack " + "does not implement interface RTCRtpSender.");
      }
      var transceiver = this.transceivers.find(function(t) {
        return t.rtpSender === sender;
      });
      if (!transceiver) {
        throw makeError("InvalidAccessError", "Sender was not created by this connection.");
      }
      var stream = transceiver.stream;
      transceiver.rtpSender.stop();
      transceiver.rtpSender = null;
      transceiver.track = null;
      transceiver.stream = null;
      var localStreams = this.transceivers.map(function(t) {
        return t.stream;
      });
      if (localStreams.indexOf(stream) === -1 && this.localStreams.indexOf(stream) > -1) {
        this.localStreams.splice(this.localStreams.indexOf(stream), 1);
      }
      this._maybeFireNegotiationNeeded();
    };
    RTCPeerConnection2.prototype.removeStream = function(stream) {
      var pc = this;
      stream.getTracks().forEach(function(track) {
        var sender = pc.getSenders().find(function(s) {
          return s.track === track;
        });
        if (sender) {
          pc.removeTrack(sender);
        }
      });
    };
    RTCPeerConnection2.prototype.getSenders = function() {
      return this.transceivers.filter(function(transceiver) {
        return !!transceiver.rtpSender;
      }).map(function(transceiver) {
        return transceiver.rtpSender;
      });
    };
    RTCPeerConnection2.prototype.getReceivers = function() {
      return this.transceivers.filter(function(transceiver) {
        return !!transceiver.rtpReceiver;
      }).map(function(transceiver) {
        return transceiver.rtpReceiver;
      });
    };
    RTCPeerConnection2.prototype._createIceGatherer = function(sdpMLineIndex, usingBundle) {
      var pc = this;
      if (usingBundle && sdpMLineIndex > 0) {
        return this.transceivers[0].iceGatherer;
      } else if (this._iceGatherers.length) {
        return this._iceGatherers.shift();
      }
      var iceGatherer = new window2.RTCIceGatherer({
        iceServers: this._config.iceServers,
        gatherPolicy: this._config.iceTransportPolicy
      });
      Object.defineProperty(iceGatherer, "state", { value: "new", writable: true });
      this.transceivers[sdpMLineIndex].bufferedCandidateEvents = [];
      this.transceivers[sdpMLineIndex].bufferCandidates = function(event) {
        var end = !event.candidate || Object.keys(event.candidate).length === 0;
        iceGatherer.state = end ? "completed" : "gathering";
        if (pc.transceivers[sdpMLineIndex].bufferedCandidateEvents !== null) {
          pc.transceivers[sdpMLineIndex].bufferedCandidateEvents.push(event);
        }
      };
      iceGatherer.addEventListener("localcandidate", this.transceivers[sdpMLineIndex].bufferCandidates);
      return iceGatherer;
    };
    RTCPeerConnection2.prototype._gather = function(mid, sdpMLineIndex) {
      var pc = this;
      var iceGatherer = this.transceivers[sdpMLineIndex].iceGatherer;
      if (iceGatherer.onlocalcandidate) {
        return;
      }
      var bufferedCandidateEvents = this.transceivers[sdpMLineIndex].bufferedCandidateEvents;
      this.transceivers[sdpMLineIndex].bufferedCandidateEvents = null;
      iceGatherer.removeEventListener("localcandidate", this.transceivers[sdpMLineIndex].bufferCandidates);
      iceGatherer.onlocalcandidate = function(evt) {
        if (pc.usingBundle && sdpMLineIndex > 0) {
          return;
        }
        var event = new Event("icecandidate");
        event.candidate = { sdpMid: mid, sdpMLineIndex };
        var cand = evt.candidate;
        var end = !cand || Object.keys(cand).length === 0;
        if (end) {
          if (iceGatherer.state === "new" || iceGatherer.state === "gathering") {
            iceGatherer.state = "completed";
          }
        } else {
          if (iceGatherer.state === "new") {
            iceGatherer.state = "gathering";
          }
          cand.component = 1;
          cand.ufrag = iceGatherer.getLocalParameters().usernameFragment;
          var serializedCandidate = SDPUtils.writeCandidate(cand);
          event.candidate = Object.assign(event.candidate, SDPUtils.parseCandidate(serializedCandidate));
          event.candidate.candidate = serializedCandidate;
          event.candidate.toJSON = function() {
            return {
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              usernameFragment: event.candidate.usernameFragment
            };
          };
        }
        var sections = SDPUtils.getMediaSections(pc._localDescription.sdp);
        if (!end) {
          sections[event.candidate.sdpMLineIndex] += "a=" + event.candidate.candidate + "\r\n";
        } else {
          sections[event.candidate.sdpMLineIndex] += "a=end-of-candidates\r\n";
        }
        pc._localDescription.sdp = SDPUtils.getDescription(pc._localDescription.sdp) + sections.join("");
        var complete = pc.transceivers.every(function(transceiver) {
          return transceiver.iceGatherer && transceiver.iceGatherer.state === "completed";
        });
        if (pc.iceGatheringState !== "gathering") {
          pc.iceGatheringState = "gathering";
          pc._emitGatheringStateChange();
        }
        if (!end) {
          pc._dispatchEvent("icecandidate", event);
        }
        if (complete) {
          pc._dispatchEvent("icecandidate", new Event("icecandidate"));
          pc.iceGatheringState = "complete";
          pc._emitGatheringStateChange();
        }
      };
      window2.setTimeout(function() {
        bufferedCandidateEvents.forEach(function(e) {
          iceGatherer.onlocalcandidate(e);
        });
      }, 0);
    };
    RTCPeerConnection2.prototype._createIceAndDtlsTransports = function() {
      var pc = this;
      var iceTransport = new window2.RTCIceTransport(null);
      iceTransport.onicestatechange = function() {
        pc._updateIceConnectionState();
        pc._updateConnectionState();
      };
      var dtlsTransport = new window2.RTCDtlsTransport(iceTransport);
      dtlsTransport.ondtlsstatechange = function() {
        pc._updateConnectionState();
      };
      dtlsTransport.onerror = function() {
        Object.defineProperty(dtlsTransport, "state", { value: "failed", writable: true });
        pc._updateConnectionState();
      };
      return {
        iceTransport,
        dtlsTransport
      };
    };
    RTCPeerConnection2.prototype._disposeIceAndDtlsTransports = function(sdpMLineIndex) {
      var iceGatherer = this.transceivers[sdpMLineIndex].iceGatherer;
      if (iceGatherer) {
        delete iceGatherer.onlocalcandidate;
        delete this.transceivers[sdpMLineIndex].iceGatherer;
      }
      var iceTransport = this.transceivers[sdpMLineIndex].iceTransport;
      if (iceTransport) {
        delete iceTransport.onicestatechange;
        delete this.transceivers[sdpMLineIndex].iceTransport;
      }
      var dtlsTransport = this.transceivers[sdpMLineIndex].dtlsTransport;
      if (dtlsTransport) {
        delete dtlsTransport.ondtlsstatechange;
        delete dtlsTransport.onerror;
        delete this.transceivers[sdpMLineIndex].dtlsTransport;
      }
    };
    RTCPeerConnection2.prototype._transceive = function(transceiver, send, recv) {
      var params = getCommonCapabilities(transceiver.localCapabilities, transceiver.remoteCapabilities);
      if (send && transceiver.rtpSender) {
        params.encodings = transceiver.sendEncodingParameters;
        params.rtcp = {
          cname: SDPUtils.localCName,
          compound: transceiver.rtcpParameters.compound
        };
        if (transceiver.recvEncodingParameters.length) {
          params.rtcp.ssrc = transceiver.recvEncodingParameters[0].ssrc;
        }
        transceiver.rtpSender.send(params);
      }
      if (recv && transceiver.rtpReceiver && params.codecs.length > 0) {
        if (transceiver.kind === "video" && transceiver.recvEncodingParameters && edgeVersion < 15019) {
          transceiver.recvEncodingParameters.forEach(function(p) {
            delete p.rtx;
          });
        }
        if (transceiver.recvEncodingParameters.length) {
          params.encodings = transceiver.recvEncodingParameters;
        } else {
          params.encodings = [{}];
        }
        params.rtcp = {
          compound: transceiver.rtcpParameters.compound
        };
        if (transceiver.rtcpParameters.cname) {
          params.rtcp.cname = transceiver.rtcpParameters.cname;
        }
        if (transceiver.sendEncodingParameters.length) {
          params.rtcp.ssrc = transceiver.sendEncodingParameters[0].ssrc;
        }
        transceiver.rtpReceiver.receive(params);
      }
    };
    RTCPeerConnection2.prototype.setLocalDescription = function(description) {
      var pc = this;
      if (["offer", "answer"].indexOf(description.type) === -1) {
        return Promise.reject(makeError("TypeError", 'Unsupported type "' + description.type + '"'));
      }
      if (!isActionAllowedInSignalingState("setLocalDescription", description.type, pc.signalingState) || pc._isClosed) {
        return Promise.reject(makeError("InvalidStateError", "Can not set local " + description.type + " in state " + pc.signalingState));
      }
      var sections;
      var sessionpart;
      if (description.type === "offer") {
        sections = SDPUtils.splitSections(description.sdp);
        sessionpart = sections.shift();
        sections.forEach(function(mediaSection, sdpMLineIndex) {
          var caps = SDPUtils.parseRtpParameters(mediaSection);
          pc.transceivers[sdpMLineIndex].localCapabilities = caps;
        });
        pc.transceivers.forEach(function(transceiver, sdpMLineIndex) {
          pc._gather(transceiver.mid, sdpMLineIndex);
        });
      } else if (description.type === "answer") {
        sections = SDPUtils.splitSections(pc._remoteDescription.sdp);
        sessionpart = sections.shift();
        var isIceLite = SDPUtils.matchPrefix(sessionpart, "a=ice-lite").length > 0;
        sections.forEach(function(mediaSection, sdpMLineIndex) {
          var transceiver = pc.transceivers[sdpMLineIndex];
          var iceGatherer = transceiver.iceGatherer;
          var iceTransport = transceiver.iceTransport;
          var dtlsTransport = transceiver.dtlsTransport;
          var localCapabilities = transceiver.localCapabilities;
          var remoteCapabilities = transceiver.remoteCapabilities;
          var rejected = SDPUtils.isRejected(mediaSection) && SDPUtils.matchPrefix(mediaSection, "a=bundle-only").length === 0;
          if (!rejected && !transceiver.rejected) {
            var remoteIceParameters = SDPUtils.getIceParameters(mediaSection, sessionpart);
            var remoteDtlsParameters = SDPUtils.getDtlsParameters(mediaSection, sessionpart);
            if (isIceLite) {
              remoteDtlsParameters.role = "server";
            }
            if (!pc.usingBundle || sdpMLineIndex === 0) {
              pc._gather(transceiver.mid, sdpMLineIndex);
              if (iceTransport.state === "new") {
                iceTransport.start(iceGatherer, remoteIceParameters, isIceLite ? "controlling" : "controlled");
              }
              if (dtlsTransport.state === "new") {
                dtlsTransport.start(remoteDtlsParameters);
              }
            }
            var params = getCommonCapabilities(localCapabilities, remoteCapabilities);
            pc._transceive(transceiver, params.codecs.length > 0, false);
          }
        });
      }
      pc._localDescription = {
        type: description.type,
        sdp: description.sdp
      };
      if (description.type === "offer") {
        pc._updateSignalingState("have-local-offer");
      } else {
        pc._updateSignalingState("stable");
      }
      return Promise.resolve();
    };
    RTCPeerConnection2.prototype.setRemoteDescription = function(description) {
      var pc = this;
      if (["offer", "answer"].indexOf(description.type) === -1) {
        return Promise.reject(makeError("TypeError", 'Unsupported type "' + description.type + '"'));
      }
      if (!isActionAllowedInSignalingState("setRemoteDescription", description.type, pc.signalingState) || pc._isClosed) {
        return Promise.reject(makeError("InvalidStateError", "Can not set remote " + description.type + " in state " + pc.signalingState));
      }
      var streams = {};
      pc.remoteStreams.forEach(function(stream) {
        streams[stream.id] = stream;
      });
      var receiverList = [];
      var sections = SDPUtils.splitSections(description.sdp);
      var sessionpart = sections.shift();
      var isIceLite = SDPUtils.matchPrefix(sessionpart, "a=ice-lite").length > 0;
      var usingBundle = SDPUtils.matchPrefix(sessionpart, "a=group:BUNDLE ").length > 0;
      pc.usingBundle = usingBundle;
      var iceOptions = SDPUtils.matchPrefix(sessionpart, "a=ice-options:")[0];
      if (iceOptions) {
        pc.canTrickleIceCandidates = iceOptions.substr(14).split(" ").indexOf("trickle") >= 0;
      } else {
        pc.canTrickleIceCandidates = false;
      }
      sections.forEach(function(mediaSection, sdpMLineIndex) {
        var lines = SDPUtils.splitLines(mediaSection);
        var kind = SDPUtils.getKind(mediaSection);
        var rejected = SDPUtils.isRejected(mediaSection) && SDPUtils.matchPrefix(mediaSection, "a=bundle-only").length === 0;
        var protocol = lines[0].substr(2).split(" ")[2];
        var direction = SDPUtils.getDirection(mediaSection, sessionpart);
        var remoteMsid = SDPUtils.parseMsid(mediaSection);
        var mid = SDPUtils.getMid(mediaSection) || SDPUtils.generateIdentifier();
        if (rejected || kind === "application" && (protocol === "DTLS/SCTP" || protocol === "UDP/DTLS/SCTP")) {
          pc.transceivers[sdpMLineIndex] = {
            mid,
            kind,
            protocol,
            rejected: true
          };
          return;
        }
        if (!rejected && pc.transceivers[sdpMLineIndex] && pc.transceivers[sdpMLineIndex].rejected) {
          pc.transceivers[sdpMLineIndex] = pc._createTransceiver(kind, true);
        }
        var transceiver;
        var iceGatherer;
        var iceTransport;
        var dtlsTransport;
        var rtpReceiver;
        var sendEncodingParameters;
        var recvEncodingParameters;
        var localCapabilities;
        var track;
        var remoteCapabilities = SDPUtils.parseRtpParameters(mediaSection);
        var remoteIceParameters;
        var remoteDtlsParameters;
        if (!rejected) {
          remoteIceParameters = SDPUtils.getIceParameters(mediaSection, sessionpart);
          remoteDtlsParameters = SDPUtils.getDtlsParameters(mediaSection, sessionpart);
          remoteDtlsParameters.role = "client";
        }
        recvEncodingParameters = SDPUtils.parseRtpEncodingParameters(mediaSection);
        var rtcpParameters = SDPUtils.parseRtcpParameters(mediaSection);
        var isComplete = SDPUtils.matchPrefix(mediaSection, "a=end-of-candidates", sessionpart).length > 0;
        var cands = SDPUtils.matchPrefix(mediaSection, "a=candidate:").map(function(cand) {
          return SDPUtils.parseCandidate(cand);
        }).filter(function(cand) {
          return cand.component === 1;
        });
        if ((description.type === "offer" || description.type === "answer") && !rejected && usingBundle && sdpMLineIndex > 0 && pc.transceivers[sdpMLineIndex]) {
          pc._disposeIceAndDtlsTransports(sdpMLineIndex);
          pc.transceivers[sdpMLineIndex].iceGatherer = pc.transceivers[0].iceGatherer;
          pc.transceivers[sdpMLineIndex].iceTransport = pc.transceivers[0].iceTransport;
          pc.transceivers[sdpMLineIndex].dtlsTransport = pc.transceivers[0].dtlsTransport;
          if (pc.transceivers[sdpMLineIndex].rtpSender) {
            pc.transceivers[sdpMLineIndex].rtpSender.setTransport(pc.transceivers[0].dtlsTransport);
          }
          if (pc.transceivers[sdpMLineIndex].rtpReceiver) {
            pc.transceivers[sdpMLineIndex].rtpReceiver.setTransport(pc.transceivers[0].dtlsTransport);
          }
        }
        if (description.type === "offer" && !rejected) {
          transceiver = pc.transceivers[sdpMLineIndex] || pc._createTransceiver(kind);
          transceiver.mid = mid;
          if (!transceiver.iceGatherer) {
            transceiver.iceGatherer = pc._createIceGatherer(sdpMLineIndex, usingBundle);
          }
          if (cands.length && transceiver.iceTransport.state === "new") {
            if (isComplete && (!usingBundle || sdpMLineIndex === 0)) {
              transceiver.iceTransport.setRemoteCandidates(cands);
            } else {
              cands.forEach(function(candidate) {
                maybeAddCandidate(transceiver.iceTransport, candidate);
              });
            }
          }
          localCapabilities = window2.RTCRtpReceiver.getCapabilities(kind);
          if (edgeVersion < 15019) {
            localCapabilities.codecs = localCapabilities.codecs.filter(function(codec) {
              return codec.name !== "rtx";
            });
          }
          sendEncodingParameters = transceiver.sendEncodingParameters || [{
            ssrc: (2 * sdpMLineIndex + 2) * 1001
          }];
          var isNewTrack = false;
          if (direction === "sendrecv" || direction === "sendonly") {
            isNewTrack = !transceiver.rtpReceiver;
            rtpReceiver = transceiver.rtpReceiver || new window2.RTCRtpReceiver(transceiver.dtlsTransport, kind);
            if (isNewTrack) {
              var stream;
              track = rtpReceiver.track;
              if (remoteMsid && remoteMsid.stream === "-") {
              } else if (remoteMsid) {
                if (!streams[remoteMsid.stream]) {
                  streams[remoteMsid.stream] = new window2.MediaStream;
                  Object.defineProperty(streams[remoteMsid.stream], "id", {
                    get: function() {
                      return remoteMsid.stream;
                    }
                  });
                }
                Object.defineProperty(track, "id", {
                  get: function() {
                    return remoteMsid.track;
                  }
                });
                stream = streams[remoteMsid.stream];
              } else {
                if (!streams.default) {
                  streams.default = new window2.MediaStream;
                }
                stream = streams.default;
              }
              if (stream) {
                addTrackToStreamAndFireEvent(track, stream);
                transceiver.associatedRemoteMediaStreams.push(stream);
              }
              receiverList.push([track, rtpReceiver, stream]);
            }
          } else if (transceiver.rtpReceiver && transceiver.rtpReceiver.track) {
            transceiver.associatedRemoteMediaStreams.forEach(function(s) {
              var nativeTrack = s.getTracks().find(function(t) {
                return t.id === transceiver.rtpReceiver.track.id;
              });
              if (nativeTrack) {
                removeTrackFromStreamAndFireEvent(nativeTrack, s);
              }
            });
            transceiver.associatedRemoteMediaStreams = [];
          }
          transceiver.localCapabilities = localCapabilities;
          transceiver.remoteCapabilities = remoteCapabilities;
          transceiver.rtpReceiver = rtpReceiver;
          transceiver.rtcpParameters = rtcpParameters;
          transceiver.sendEncodingParameters = sendEncodingParameters;
          transceiver.recvEncodingParameters = recvEncodingParameters;
          pc._transceive(pc.transceivers[sdpMLineIndex], false, isNewTrack);
        } else if (description.type === "answer" && !rejected) {
          transceiver = pc.transceivers[sdpMLineIndex];
          iceGatherer = transceiver.iceGatherer;
          iceTransport = transceiver.iceTransport;
          dtlsTransport = transceiver.dtlsTransport;
          rtpReceiver = transceiver.rtpReceiver;
          sendEncodingParameters = transceiver.sendEncodingParameters;
          localCapabilities = transceiver.localCapabilities;
          pc.transceivers[sdpMLineIndex].recvEncodingParameters = recvEncodingParameters;
          pc.transceivers[sdpMLineIndex].remoteCapabilities = remoteCapabilities;
          pc.transceivers[sdpMLineIndex].rtcpParameters = rtcpParameters;
          if (cands.length && iceTransport.state === "new") {
            if ((isIceLite || isComplete) && (!usingBundle || sdpMLineIndex === 0)) {
              iceTransport.setRemoteCandidates(cands);
            } else {
              cands.forEach(function(candidate) {
                maybeAddCandidate(transceiver.iceTransport, candidate);
              });
            }
          }
          if (!usingBundle || sdpMLineIndex === 0) {
            if (iceTransport.state === "new") {
              iceTransport.start(iceGatherer, remoteIceParameters, "controlling");
            }
            if (dtlsTransport.state === "new") {
              dtlsTransport.start(remoteDtlsParameters);
            }
          }
          var commonCapabilities = getCommonCapabilities(transceiver.localCapabilities, transceiver.remoteCapabilities);
          var hasRtx = commonCapabilities.codecs.filter(function(c) {
            return c.name.toLowerCase() === "rtx";
          }).length;
          if (!hasRtx && transceiver.sendEncodingParameters[0].rtx) {
            delete transceiver.sendEncodingParameters[0].rtx;
          }
          pc._transceive(transceiver, direction === "sendrecv" || direction === "recvonly", direction === "sendrecv" || direction === "sendonly");
          if (rtpReceiver && (direction === "sendrecv" || direction === "sendonly")) {
            track = rtpReceiver.track;
            if (remoteMsid) {
              if (!streams[remoteMsid.stream]) {
                streams[remoteMsid.stream] = new window2.MediaStream;
              }
              addTrackToStreamAndFireEvent(track, streams[remoteMsid.stream]);
              receiverList.push([track, rtpReceiver, streams[remoteMsid.stream]]);
            } else {
              if (!streams.default) {
                streams.default = new window2.MediaStream;
              }
              addTrackToStreamAndFireEvent(track, streams.default);
              receiverList.push([track, rtpReceiver, streams.default]);
            }
          } else {
            delete transceiver.rtpReceiver;
          }
        }
      });
      if (pc._dtlsRole === undefined) {
        pc._dtlsRole = description.type === "offer" ? "active" : "passive";
      }
      pc._remoteDescription = {
        type: description.type,
        sdp: description.sdp
      };
      if (description.type === "offer") {
        pc._updateSignalingState("have-remote-offer");
      } else {
        pc._updateSignalingState("stable");
      }
      Object.keys(streams).forEach(function(sid) {
        var stream = streams[sid];
        if (stream.getTracks().length) {
          if (pc.remoteStreams.indexOf(stream) === -1) {
            pc.remoteStreams.push(stream);
            var event = new Event("addstream");
            event.stream = stream;
            window2.setTimeout(function() {
              pc._dispatchEvent("addstream", event);
            });
          }
          receiverList.forEach(function(item) {
            var track = item[0];
            var receiver = item[1];
            if (stream.id !== item[2].id) {
              return;
            }
            fireAddTrack(pc, track, receiver, [stream]);
          });
        }
      });
      receiverList.forEach(function(item) {
        if (item[2]) {
          return;
        }
        fireAddTrack(pc, item[0], item[1], []);
      });
      window2.setTimeout(function() {
        if (!(pc && pc.transceivers)) {
          return;
        }
        pc.transceivers.forEach(function(transceiver) {
          if (transceiver.iceTransport && transceiver.iceTransport.state === "new" && transceiver.iceTransport.getRemoteCandidates().length > 0) {
            console.warn("Timeout for addRemoteCandidate. Consider sending " + "an end-of-candidates notification");
            transceiver.iceTransport.addRemoteCandidate({});
          }
        });
      }, 4000);
      return Promise.resolve();
    };
    RTCPeerConnection2.prototype.close = function() {
      this.transceivers.forEach(function(transceiver) {
        if (transceiver.iceTransport) {
          transceiver.iceTransport.stop();
        }
        if (transceiver.dtlsTransport) {
          transceiver.dtlsTransport.stop();
        }
        if (transceiver.rtpSender) {
          transceiver.rtpSender.stop();
        }
        if (transceiver.rtpReceiver) {
          transceiver.rtpReceiver.stop();
        }
      });
      this._isClosed = true;
      this._updateSignalingState("closed");
    };
    RTCPeerConnection2.prototype._updateSignalingState = function(newState) {
      this.signalingState = newState;
      var event = new Event("signalingstatechange");
      this._dispatchEvent("signalingstatechange", event);
    };
    RTCPeerConnection2.prototype._maybeFireNegotiationNeeded = function() {
      var pc = this;
      if (this.signalingState !== "stable" || this.needNegotiation === true) {
        return;
      }
      this.needNegotiation = true;
      window2.setTimeout(function() {
        if (pc.needNegotiation) {
          pc.needNegotiation = false;
          var event = new Event("negotiationneeded");
          pc._dispatchEvent("negotiationneeded", event);
        }
      }, 0);
    };
    RTCPeerConnection2.prototype._updateIceConnectionState = function() {
      var newState;
      var states = {
        new: 0,
        closed: 0,
        checking: 0,
        connected: 0,
        completed: 0,
        disconnected: 0,
        failed: 0
      };
      this.transceivers.forEach(function(transceiver) {
        if (transceiver.iceTransport && !transceiver.rejected) {
          states[transceiver.iceTransport.state]++;
        }
      });
      newState = "new";
      if (states.failed > 0) {
        newState = "failed";
      } else if (states.checking > 0) {
        newState = "checking";
      } else if (states.disconnected > 0) {
        newState = "disconnected";
      } else if (states.new > 0) {
        newState = "new";
      } else if (states.connected > 0) {
        newState = "connected";
      } else if (states.completed > 0) {
        newState = "completed";
      }
      if (newState !== this.iceConnectionState) {
        this.iceConnectionState = newState;
        var event = new Event("iceconnectionstatechange");
        this._dispatchEvent("iceconnectionstatechange", event);
      }
    };
    RTCPeerConnection2.prototype._updateConnectionState = function() {
      var newState;
      var states = {
        new: 0,
        closed: 0,
        connecting: 0,
        connected: 0,
        completed: 0,
        disconnected: 0,
        failed: 0
      };
      this.transceivers.forEach(function(transceiver) {
        if (transceiver.iceTransport && transceiver.dtlsTransport && !transceiver.rejected) {
          states[transceiver.iceTransport.state]++;
          states[transceiver.dtlsTransport.state]++;
        }
      });
      states.connected += states.completed;
      newState = "new";
      if (states.failed > 0) {
        newState = "failed";
      } else if (states.connecting > 0) {
        newState = "connecting";
      } else if (states.disconnected > 0) {
        newState = "disconnected";
      } else if (states.new > 0) {
        newState = "new";
      } else if (states.connected > 0) {
        newState = "connected";
      }
      if (newState !== this.connectionState) {
        this.connectionState = newState;
        var event = new Event("connectionstatechange");
        this._dispatchEvent("connectionstatechange", event);
      }
    };
    RTCPeerConnection2.prototype.createOffer = function() {
      var pc = this;
      if (pc._isClosed) {
        return Promise.reject(makeError("InvalidStateError", "Can not call createOffer after close"));
      }
      var numAudioTracks = pc.transceivers.filter(function(t) {
        return t.kind === "audio";
      }).length;
      var numVideoTracks = pc.transceivers.filter(function(t) {
        return t.kind === "video";
      }).length;
      var offerOptions = arguments[0];
      if (offerOptions) {
        if (offerOptions.mandatory || offerOptions.optional) {
          throw new TypeError("Legacy mandatory/optional constraints not supported.");
        }
        if (offerOptions.offerToReceiveAudio !== undefined) {
          if (offerOptions.offerToReceiveAudio === true) {
            numAudioTracks = 1;
          } else if (offerOptions.offerToReceiveAudio === false) {
            numAudioTracks = 0;
          } else {
            numAudioTracks = offerOptions.offerToReceiveAudio;
          }
        }
        if (offerOptions.offerToReceiveVideo !== undefined) {
          if (offerOptions.offerToReceiveVideo === true) {
            numVideoTracks = 1;
          } else if (offerOptions.offerToReceiveVideo === false) {
            numVideoTracks = 0;
          } else {
            numVideoTracks = offerOptions.offerToReceiveVideo;
          }
        }
      }
      pc.transceivers.forEach(function(transceiver) {
        if (transceiver.kind === "audio") {
          numAudioTracks--;
          if (numAudioTracks < 0) {
            transceiver.wantReceive = false;
          }
        } else if (transceiver.kind === "video") {
          numVideoTracks--;
          if (numVideoTracks < 0) {
            transceiver.wantReceive = false;
          }
        }
      });
      while (numAudioTracks > 0 || numVideoTracks > 0) {
        if (numAudioTracks > 0) {
          pc._createTransceiver("audio");
          numAudioTracks--;
        }
        if (numVideoTracks > 0) {
          pc._createTransceiver("video");
          numVideoTracks--;
        }
      }
      var sdp = SDPUtils.writeSessionBoilerplate(pc._sdpSessionId, pc._sdpSessionVersion++);
      pc.transceivers.forEach(function(transceiver, sdpMLineIndex) {
        var track = transceiver.track;
        var kind = transceiver.kind;
        var mid = transceiver.mid || SDPUtils.generateIdentifier();
        transceiver.mid = mid;
        if (!transceiver.iceGatherer) {
          transceiver.iceGatherer = pc._createIceGatherer(sdpMLineIndex, pc.usingBundle);
        }
        var localCapabilities = window2.RTCRtpSender.getCapabilities(kind);
        if (edgeVersion < 15019) {
          localCapabilities.codecs = localCapabilities.codecs.filter(function(codec) {
            return codec.name !== "rtx";
          });
        }
        localCapabilities.codecs.forEach(function(codec) {
          if (codec.name === "H264" && codec.parameters["level-asymmetry-allowed"] === undefined) {
            codec.parameters["level-asymmetry-allowed"] = "1";
          }
          if (transceiver.remoteCapabilities && transceiver.remoteCapabilities.codecs) {
            transceiver.remoteCapabilities.codecs.forEach(function(remoteCodec) {
              if (codec.name.toLowerCase() === remoteCodec.name.toLowerCase() && codec.clockRate === remoteCodec.clockRate) {
                codec.preferredPayloadType = remoteCodec.payloadType;
              }
            });
          }
        });
        localCapabilities.headerExtensions.forEach(function(hdrExt) {
          var remoteExtensions = transceiver.remoteCapabilities && transceiver.remoteCapabilities.headerExtensions || [];
          remoteExtensions.forEach(function(rHdrExt) {
            if (hdrExt.uri === rHdrExt.uri) {
              hdrExt.id = rHdrExt.id;
            }
          });
        });
        var sendEncodingParameters = transceiver.sendEncodingParameters || [{
          ssrc: (2 * sdpMLineIndex + 1) * 1001
        }];
        if (track) {
          if (edgeVersion >= 15019 && kind === "video" && !sendEncodingParameters[0].rtx) {
            sendEncodingParameters[0].rtx = {
              ssrc: sendEncodingParameters[0].ssrc + 1
            };
          }
        }
        if (transceiver.wantReceive) {
          transceiver.rtpReceiver = new window2.RTCRtpReceiver(transceiver.dtlsTransport, kind);
        }
        transceiver.localCapabilities = localCapabilities;
        transceiver.sendEncodingParameters = sendEncodingParameters;
      });
      if (pc._config.bundlePolicy !== "max-compat") {
        sdp += "a=group:BUNDLE " + pc.transceivers.map(function(t) {
          return t.mid;
        }).join(" ") + "\r\n";
      }
      sdp += "a=ice-options:trickle\r\n";
      pc.transceivers.forEach(function(transceiver, sdpMLineIndex) {
        sdp += writeMediaSection(transceiver, transceiver.localCapabilities, "offer", transceiver.stream, pc._dtlsRole);
        sdp += "a=rtcp-rsize\r\n";
        if (transceiver.iceGatherer && pc.iceGatheringState !== "new" && (sdpMLineIndex === 0 || !pc.usingBundle)) {
          transceiver.iceGatherer.getLocalCandidates().forEach(function(cand) {
            cand.component = 1;
            sdp += "a=" + SDPUtils.writeCandidate(cand) + "\r\n";
          });
          if (transceiver.iceGatherer.state === "completed") {
            sdp += "a=end-of-candidates\r\n";
          }
        }
      });
      var desc = new window2.RTCSessionDescription({
        type: "offer",
        sdp
      });
      return Promise.resolve(desc);
    };
    RTCPeerConnection2.prototype.createAnswer = function() {
      var pc = this;
      if (pc._isClosed) {
        return Promise.reject(makeError("InvalidStateError", "Can not call createAnswer after close"));
      }
      if (!(pc.signalingState === "have-remote-offer" || pc.signalingState === "have-local-pranswer")) {
        return Promise.reject(makeError("InvalidStateError", "Can not call createAnswer in signalingState " + pc.signalingState));
      }
      var sdp = SDPUtils.writeSessionBoilerplate(pc._sdpSessionId, pc._sdpSessionVersion++);
      if (pc.usingBundle) {
        sdp += "a=group:BUNDLE " + pc.transceivers.map(function(t) {
          return t.mid;
        }).join(" ") + "\r\n";
      }
      sdp += "a=ice-options:trickle\r\n";
      var mediaSectionsInOffer = SDPUtils.getMediaSections(pc._remoteDescription.sdp).length;
      pc.transceivers.forEach(function(transceiver, sdpMLineIndex) {
        if (sdpMLineIndex + 1 > mediaSectionsInOffer) {
          return;
        }
        if (transceiver.rejected) {
          if (transceiver.kind === "application") {
            if (transceiver.protocol === "DTLS/SCTP") {
              sdp += "m=application 0 DTLS/SCTP 5000\r\n";
            } else {
              sdp += "m=application 0 " + transceiver.protocol + " webrtc-datachannel\r\n";
            }
          } else if (transceiver.kind === "audio") {
            sdp += "m=audio 0 UDP/TLS/RTP/SAVPF 0\r\n" + "a=rtpmap:0 PCMU/8000\r\n";
          } else if (transceiver.kind === "video") {
            sdp += "m=video 0 UDP/TLS/RTP/SAVPF 120\r\n" + "a=rtpmap:120 VP8/90000\r\n";
          }
          sdp += "c=IN IP4 0.0.0.0\r\n" + "a=inactive\r\n" + "a=mid:" + transceiver.mid + "\r\n";
          return;
        }
        if (transceiver.stream) {
          var localTrack;
          if (transceiver.kind === "audio") {
            localTrack = transceiver.stream.getAudioTracks()[0];
          } else if (transceiver.kind === "video") {
            localTrack = transceiver.stream.getVideoTracks()[0];
          }
          if (localTrack) {
            if (edgeVersion >= 15019 && transceiver.kind === "video" && !transceiver.sendEncodingParameters[0].rtx) {
              transceiver.sendEncodingParameters[0].rtx = {
                ssrc: transceiver.sendEncodingParameters[0].ssrc + 1
              };
            }
          }
        }
        var commonCapabilities = getCommonCapabilities(transceiver.localCapabilities, transceiver.remoteCapabilities);
        var hasRtx = commonCapabilities.codecs.filter(function(c) {
          return c.name.toLowerCase() === "rtx";
        }).length;
        if (!hasRtx && transceiver.sendEncodingParameters[0].rtx) {
          delete transceiver.sendEncodingParameters[0].rtx;
        }
        sdp += writeMediaSection(transceiver, commonCapabilities, "answer", transceiver.stream, pc._dtlsRole);
        if (transceiver.rtcpParameters && transceiver.rtcpParameters.reducedSize) {
          sdp += "a=rtcp-rsize\r\n";
        }
      });
      var desc = new window2.RTCSessionDescription({
        type: "answer",
        sdp
      });
      return Promise.resolve(desc);
    };
    RTCPeerConnection2.prototype.addIceCandidate = function(candidate) {
      var pc = this;
      var sections;
      if (candidate && !(candidate.sdpMLineIndex !== undefined || candidate.sdpMid)) {
        return Promise.reject(new TypeError("sdpMLineIndex or sdpMid required"));
      }
      return new Promise(function(resolve, reject) {
        if (!pc._remoteDescription) {
          return reject(makeError("InvalidStateError", "Can not add ICE candidate without a remote description"));
        } else if (!candidate || candidate.candidate === "") {
          for (var j = 0;j < pc.transceivers.length; j++) {
            if (pc.transceivers[j].rejected) {
              continue;
            }
            pc.transceivers[j].iceTransport.addRemoteCandidate({});
            sections = SDPUtils.getMediaSections(pc._remoteDescription.sdp);
            sections[j] += "a=end-of-candidates\r\n";
            pc._remoteDescription.sdp = SDPUtils.getDescription(pc._remoteDescription.sdp) + sections.join("");
            if (pc.usingBundle) {
              break;
            }
          }
        } else {
          var sdpMLineIndex = candidate.sdpMLineIndex;
          if (candidate.sdpMid) {
            for (var i = 0;i < pc.transceivers.length; i++) {
              if (pc.transceivers[i].mid === candidate.sdpMid) {
                sdpMLineIndex = i;
                break;
              }
            }
          }
          var transceiver = pc.transceivers[sdpMLineIndex];
          if (transceiver) {
            if (transceiver.rejected) {
              return resolve();
            }
            var cand = Object.keys(candidate.candidate).length > 0 ? SDPUtils.parseCandidate(candidate.candidate) : {};
            if (cand.protocol === "tcp" && (cand.port === 0 || cand.port === 9)) {
              return resolve();
            }
            if (cand.component && cand.component !== 1) {
              return resolve();
            }
            if (sdpMLineIndex === 0 || sdpMLineIndex > 0 && transceiver.iceTransport !== pc.transceivers[0].iceTransport) {
              if (!maybeAddCandidate(transceiver.iceTransport, cand)) {
                return reject(makeError("OperationError", "Can not add ICE candidate"));
              }
            }
            var candidateString = candidate.candidate.trim();
            if (candidateString.indexOf("a=") === 0) {
              candidateString = candidateString.substr(2);
            }
            sections = SDPUtils.getMediaSections(pc._remoteDescription.sdp);
            sections[sdpMLineIndex] += "a=" + (cand.type ? candidateString : "end-of-candidates") + "\r\n";
            pc._remoteDescription.sdp = SDPUtils.getDescription(pc._remoteDescription.sdp) + sections.join("");
          } else {
            return reject(makeError("OperationError", "Can not add ICE candidate"));
          }
        }
        resolve();
      });
    };
    RTCPeerConnection2.prototype.getStats = function(selector) {
      if (selector && selector instanceof window2.MediaStreamTrack) {
        var senderOrReceiver = null;
        this.transceivers.forEach(function(transceiver) {
          if (transceiver.rtpSender && transceiver.rtpSender.track === selector) {
            senderOrReceiver = transceiver.rtpSender;
          } else if (transceiver.rtpReceiver && transceiver.rtpReceiver.track === selector) {
            senderOrReceiver = transceiver.rtpReceiver;
          }
        });
        if (!senderOrReceiver) {
          throw makeError("InvalidAccessError", "Invalid selector.");
        }
        return senderOrReceiver.getStats();
      }
      var promises = [];
      this.transceivers.forEach(function(transceiver) {
        [
          "rtpSender",
          "rtpReceiver",
          "iceGatherer",
          "iceTransport",
          "dtlsTransport"
        ].forEach(function(method) {
          if (transceiver[method]) {
            promises.push(transceiver[method].getStats());
          }
        });
      });
      return Promise.all(promises).then(function(allStats) {
        var results = new Map;
        allStats.forEach(function(stats) {
          stats.forEach(function(stat) {
            results.set(stat.id, stat);
          });
        });
        return results;
      });
    };
    var ortcObjects = [
      "RTCRtpSender",
      "RTCRtpReceiver",
      "RTCIceGatherer",
      "RTCIceTransport",
      "RTCDtlsTransport"
    ];
    ortcObjects.forEach(function(ortcObjectName) {
      var obj = window2[ortcObjectName];
      if (obj && obj.prototype && obj.prototype.getStats) {
        var nativeGetstats = obj.prototype.getStats;
        obj.prototype.getStats = function() {
          return nativeGetstats.apply(this).then(function(nativeStats) {
            var mapStats = new Map;
            Object.keys(nativeStats).forEach(function(id) {
              nativeStats[id].type = fixStatsType(nativeStats[id]);
              mapStats.set(id, nativeStats[id]);
            });
            return mapStats;
          });
        };
      }
    });
    var methods = ["createOffer", "createAnswer"];
    methods.forEach(function(method) {
      var nativeMethod = RTCPeerConnection2.prototype[method];
      RTCPeerConnection2.prototype[method] = function() {
        var args = arguments;
        if (typeof args[0] === "function" || typeof args[1] === "function") {
          return nativeMethod.apply(this, [arguments[2]]).then(function(description) {
            if (typeof args[0] === "function") {
              args[0].apply(null, [description]);
            }
          }, function(error) {
            if (typeof args[1] === "function") {
              args[1].apply(null, [error]);
            }
          });
        }
        return nativeMethod.apply(this, arguments);
      };
    });
    methods = ["setLocalDescription", "setRemoteDescription", "addIceCandidate"];
    methods.forEach(function(method) {
      var nativeMethod = RTCPeerConnection2.prototype[method];
      RTCPeerConnection2.prototype[method] = function() {
        var args = arguments;
        if (typeof args[1] === "function" || typeof args[2] === "function") {
          return nativeMethod.apply(this, arguments).then(function() {
            if (typeof args[1] === "function") {
              args[1].apply(null);
            }
          }, function(error) {
            if (typeof args[2] === "function") {
              args[2].apply(null, [error]);
            }
          });
        }
        return nativeMethod.apply(this, arguments);
      };
    });
    ["getStats"].forEach(function(method) {
      var nativeMethod = RTCPeerConnection2.prototype[method];
      RTCPeerConnection2.prototype[method] = function() {
        var args = arguments;
        if (typeof args[1] === "function") {
          return nativeMethod.apply(this, arguments).then(function() {
            if (typeof args[1] === "function") {
              args[1].apply(null);
            }
          });
        }
        return nativeMethod.apply(this, arguments);
      };
    });
    return RTCPeerConnection2;
  };
});

// node_modules/cockatiel/dist/esm/backoff/ConstantBackoff.js
class ConstantBackoff {
  constructor(interval) {
    this.interval = interval;
  }
  next() {
    return instance(this.interval);
  }
}
var instance = (interval) => ({
  duration: interval,
  next() {
    return this;
  }
});

// node_modules/cockatiel/dist/esm/backoff/ExponentialBackoffGenerators.js
var pFactor = 4;
var rpScalingFactor = 1 / 1.4;
var decorrelatedJitterGenerator = (state, options) => {
  const [attempt, prev] = state || [0, 0];
  const t = attempt + Math.random();
  const next = Math.pow(options.exponent, t) * Math.tanh(Math.sqrt(pFactor * t));
  const formulaIntrinsicValue = isFinite(next) ? Math.max(0, next - prev) : Infinity;
  return [
    Math.min(formulaIntrinsicValue * rpScalingFactor * options.initialDelay, options.maxDelay),
    [attempt + 1, next]
  ];
};

// node_modules/cockatiel/dist/esm/backoff/ExponentialBackoff.js
var defaultOptions = {
  generator: decorrelatedJitterGenerator,
  maxDelay: 30000,
  exponent: 2,
  initialDelay: 128
};

class ExponentialBackoff {
  constructor(options) {
    this.options = options ? { ...defaultOptions, ...options } : defaultOptions;
  }
  next() {
    return instance2(this.options).next(undefined);
  }
}
var instance2 = (options, state, delay = 0, attempt = -1) => ({
  duration: delay,
  next() {
    const [nextDelay, nextState] = options.generator(state, options);
    return instance2(options, nextState, nextDelay, attempt + 1);
  }
});

// node_modules/cockatiel/dist/esm/errors/TaskCancelledError.js
class TaskCancelledError extends Error {
  constructor(message = "Operation cancelled") {
    super(message);
    this.message = message;
    this.isTaskCancelledError = true;
  }
}

// node_modules/cockatiel/dist/esm/common/Event.js
var noopDisposable = { dispose: () => {
  return;
} };
var Event2;
(function(Event3) {
  Event3.once = (event, listener) => {
    let syncDispose = false;
    let disposable;
    disposable = event((value) => {
      listener(value);
      if (disposable) {
        disposable.dispose();
      } else {
        syncDispose = true;
      }
    });
    if (syncDispose) {
      disposable.dispose();
      return noopDisposable;
    }
    return disposable;
  };
  Event3.toPromise = (event, signal) => {
    if (!signal) {
      return new Promise((resolve) => Event3.once(event, resolve));
    }
    if (signal.aborted) {
      return Promise.reject(new TaskCancelledError);
    }
    return new Promise((resolve, reject) => {
      const d1 = onAbort(signal)(() => {
        d2.dispose();
        reject(new TaskCancelledError);
      });
      const d2 = Event3.once(event, (data) => {
        d1.dispose();
        resolve(data);
      });
    });
  };
})(Event2 || (Event2 = {}));
var onAbort = (signal) => {
  const evt = new OneShotEvent;
  if (signal.aborted) {
    evt.emit();
    return evt.addListener;
  }
  const l = () => {
    evt.emit();
    signal.removeEventListener("abort", l);
  };
  signal.addEventListener("abort", l);
  return evt.addListener;
};

class EventEmitter {
  constructor() {
    this.addListener = (listener) => this.addListenerInner(listener);
  }
  get size() {
    if (!this.listeners) {
      return 0;
    } else if (typeof this.listeners === "function") {
      return 1;
    } else {
      return this.listeners.length;
    }
  }
  emit(value) {
    if (!this.listeners) {
    } else if (typeof this.listeners === "function") {
      this.listeners(value);
    } else {
      for (const listener of this.listeners) {
        listener(value);
      }
    }
  }
  addListenerInner(listener) {
    if (!this.listeners) {
      this.listeners = listener;
    } else if (typeof this.listeners === "function") {
      this.listeners = [this.listeners, listener];
    } else {
      this.listeners.push(listener);
    }
    return { dispose: () => this.removeListener(listener) };
  }
  removeListener(listener) {
    if (!this.listeners) {
      return;
    }
    if (typeof this.listeners === "function") {
      if (this.listeners === listener) {
        this.listeners = undefined;
      }
      return;
    }
    const index = this.listeners.indexOf(listener);
    if (index === -1) {
      return;
    }
    if (this.listeners.length === 2) {
      this.listeners = index === 0 ? this.listeners[1] : this.listeners[0];
    } else {
      this.listeners = this.listeners.slice(0, index).concat(this.listeners.slice(index + 1));
    }
  }
}
class OneShotEvent extends EventEmitter {
  constructor() {
    super(...arguments);
    this.addListener = (listener) => {
      if (this.lastValue) {
        listener(this.lastValue.value);
        return noopDisposable;
      } else {
        return this.addListenerInner(listener);
      }
    };
  }
  emit(value) {
    this.lastValue = { value };
    super.emit(value);
    this.listeners = undefined;
  }
}

// node_modules/cockatiel/dist/esm/common/abort.js
var neverAbortedSignal = new AbortController().signal;
var cancelledSrc = new AbortController;
cancelledSrc.abort();
var abortedSignal = cancelledSrc.signal;

// node_modules/cockatiel/dist/esm/common/Executor.js
var returnOrThrow = (failure) => {
  if ("error" in failure) {
    throw failure.error;
  }
  if ("success" in failure) {
    return failure.success;
  }
  return failure.value;
};
var makeStopwatch = () => {
  if (typeof performance !== "undefined") {
    const start = performance.now();
    return () => performance.now() - start;
  } else {
    const start = process.hrtime.bigint();
    return () => Number(process.hrtime.bigint() - start) / 1e6;
  }
};

class ExecuteWrapper {
  constructor(errorFilter = () => false, resultFilter = () => false) {
    this.errorFilter = errorFilter;
    this.resultFilter = resultFilter;
    this.successEmitter = new EventEmitter;
    this.failureEmitter = new EventEmitter;
    this.onSuccess = this.successEmitter.addListener;
    this.onFailure = this.failureEmitter.addListener;
  }
  clone() {
    return new ExecuteWrapper(this.errorFilter, this.resultFilter);
  }
  async invoke(fn, ...args) {
    const stopwatch = this.successEmitter.size || this.failureEmitter.size ? makeStopwatch() : null;
    try {
      const value = await fn(...args);
      if (!this.resultFilter(value)) {
        if (stopwatch) {
          this.successEmitter.emit({ duration: stopwatch() });
        }
        return { success: value };
      }
      if (stopwatch) {
        this.failureEmitter.emit({ duration: stopwatch(), handled: true, reason: { value } });
      }
      return { value };
    } catch (rawError) {
      const error = rawError;
      const handled = this.errorFilter(error);
      if (stopwatch) {
        this.failureEmitter.emit({ duration: stopwatch(), handled, reason: { error } });
      }
      if (!handled) {
        throw error;
      }
      return { error };
    }
  }
}

// node_modules/cockatiel/dist/esm/NoopPolicy.js
class NoopPolicy {
  constructor() {
    this.executor = new ExecuteWrapper;
    this.onSuccess = this.executor.onSuccess;
    this.onFailure = this.executor.onFailure;
  }
  async execute(fn, signal = neverAbortedSignal) {
    return returnOrThrow(await this.executor.invoke(fn, { signal }));
  }
}

// node_modules/cockatiel/dist/esm/RetryPolicy.js
var delay = (duration, unref) => new Promise((resolve) => {
  const timer = setTimeout(resolve, duration);
  if (unref) {
    timer.unref();
  }
});

class RetryPolicy {
  constructor(options, executor) {
    this.options = options;
    this.executor = executor;
    this.onGiveUpEmitter = new EventEmitter;
    this.onRetryEmitter = new EventEmitter;
    this.onSuccess = this.executor.onSuccess;
    this.onFailure = this.executor.onFailure;
    this.onRetry = this.onRetryEmitter.addListener;
    this.onGiveUp = this.onGiveUpEmitter.addListener;
  }
  dangerouslyUnref() {
    return new RetryPolicy({ ...this.options, unref: true }, this.executor.clone());
  }
  async execute(fn, signal = neverAbortedSignal) {
    const factory = this.options.backoff || new ConstantBackoff(0);
    let backoff;
    for (let retries = 0;; retries++) {
      const result = await this.executor.invoke(fn, { attempt: retries, signal });
      if ("success" in result) {
        return result.success;
      }
      if (!signal.aborted && retries < this.options.maxAttempts) {
        const context = { attempt: retries + 1, signal, result };
        backoff = backoff ? backoff.next(context) : factory.next(context);
        const delayDuration = backoff.duration;
        const delayPromise = delay(delayDuration, !!this.options.unref);
        this.onRetryEmitter.emit({ ...result, delay: delayDuration });
        await delayPromise;
        continue;
      }
      this.onGiveUpEmitter.emit(result);
      if ("error" in result) {
        throw result.error;
      }
      return result.value;
    }
  }
}

// node_modules/cockatiel/dist/esm/Policy.js
function retry(policy, opts) {
  return new RetryPolicy({ backoff: opts.backoff || new ConstantBackoff(0), maxAttempts: opts.maxAttempts ?? Infinity }, new ExecuteWrapper(policy.options.errorFilter, policy.options.resultFilter));
}
var typeFilter = (cls, predicate) => predicate ? (v) => v instanceof cls && predicate(v) : (v) => v instanceof cls;
var always = () => true;
var never = () => false;

class Policy {
  constructor(options) {
    this.options = options;
  }
  orType(cls, predicate) {
    const filter = typeFilter(cls, predicate);
    return new Policy({
      ...this.options,
      errorFilter: (e) => this.options.errorFilter(e) || filter(e)
    });
  }
  orWhen(predicate) {
    return new Policy({
      ...this.options,
      errorFilter: (e) => this.options.errorFilter(e) || predicate(e)
    });
  }
  orWhenResult(predicate) {
    return new Policy({
      ...this.options,
      resultFilter: (r) => this.options.resultFilter(r) || predicate(r)
    });
  }
  orResultType(cls, predicate) {
    const filter = typeFilter(cls, predicate);
    return new Policy({
      ...this.options,
      resultFilter: (r) => this.options.resultFilter(r) || filter(r)
    });
  }
}
var noop = new NoopPolicy;
var handleAll = new Policy({ errorFilter: always, resultFilter: never });

// node_modules/webrtc-adapter/src/js/utils.js
function extractVersion(uastring, expr, pos) {
  const match = uastring.match(expr);
  return match && match.length >= pos && parseInt(match[pos], 10);
}
function wrapPeerConnectionEvent(window2, eventNameToWrap, wrapper) {
  if (!window2.RTCPeerConnection) {
    return;
  }
  const proto = window2.RTCPeerConnection.prototype;
  const nativeAddEventListener = proto.addEventListener;
  proto.addEventListener = function(nativeEventName, cb) {
    if (nativeEventName !== eventNameToWrap) {
      return nativeAddEventListener.apply(this, arguments);
    }
    const wrappedCallback = (e) => {
      const modifiedEvent = wrapper(e);
      if (modifiedEvent) {
        cb(modifiedEvent);
      }
    };
    this._eventMap = this._eventMap || {};
    this._eventMap[cb] = wrappedCallback;
    return nativeAddEventListener.apply(this, [
      nativeEventName,
      wrappedCallback
    ]);
  };
  const nativeRemoveEventListener = proto.removeEventListener;
  proto.removeEventListener = function(nativeEventName, cb) {
    if (nativeEventName !== eventNameToWrap || !this._eventMap || !this._eventMap[cb]) {
      return nativeRemoveEventListener.apply(this, arguments);
    }
    const unwrappedCb = this._eventMap[cb];
    delete this._eventMap[cb];
    return nativeRemoveEventListener.apply(this, [
      nativeEventName,
      unwrappedCb
    ]);
  };
  Object.defineProperty(proto, "on" + eventNameToWrap, {
    get() {
      return this["_on" + eventNameToWrap];
    },
    set(cb) {
      if (this["_on" + eventNameToWrap]) {
        this.removeEventListener(eventNameToWrap, this["_on" + eventNameToWrap]);
        delete this["_on" + eventNameToWrap];
      }
      if (cb) {
        this.addEventListener(eventNameToWrap, this["_on" + eventNameToWrap] = cb);
      }
    },
    enumerable: true,
    configurable: true
  });
}
function disableLog(bool) {
  if (typeof bool !== "boolean") {
    return new Error("Argument type: " + typeof bool + ". Please use a boolean.");
  }
  logDisabled_ = bool;
  return bool ? "adapter.js logging disabled" : "adapter.js logging enabled";
}
function disableWarnings(bool) {
  if (typeof bool !== "boolean") {
    return new Error("Argument type: " + typeof bool + ". Please use a boolean.");
  }
  deprecationWarnings_ = !bool;
  return "adapter.js deprecation warnings " + (bool ? "disabled" : "enabled");
}
function log() {
  if (typeof window === "object") {
    if (logDisabled_) {
      return;
    }
    if (typeof console !== "undefined" && typeof console.log === "function") {
      console.log.apply(console, arguments);
    }
  }
}
function deprecated(oldMethod, newMethod) {
  if (!deprecationWarnings_) {
    return;
  }
  console.warn(oldMethod + " is deprecated, please use " + newMethod + " instead.");
}
function detectBrowser(window2) {
  const { navigator: navigator2 } = window2;
  const result = { browser: null, version: null };
  if (typeof window2 === "undefined" || !window2.navigator) {
    result.browser = "Not a browser.";
    return result;
  }
  if (navigator2.mozGetUserMedia) {
    result.browser = "firefox";
    result.version = extractVersion(navigator2.userAgent, /Firefox\/(\d+)\./, 1);
  } else if (navigator2.webkitGetUserMedia || window2.isSecureContext === false && window2.webkitRTCPeerConnection && !window2.RTCIceGatherer) {
    result.browser = "chrome";
    result.version = extractVersion(navigator2.userAgent, /Chrom(e|ium)\/(\d+)\./, 2);
  } else if (navigator2.mediaDevices && navigator2.userAgent.match(/Edge\/(\d+).(\d+)$/)) {
    result.browser = "edge";
    result.version = extractVersion(navigator2.userAgent, /Edge\/(\d+).(\d+)$/, 2);
  } else if (window2.RTCPeerConnection && navigator2.userAgent.match(/AppleWebKit\/(\d+)\./)) {
    result.browser = "safari";
    result.version = extractVersion(navigator2.userAgent, /AppleWebKit\/(\d+)\./, 1);
    result.supportsUnifiedPlan = window2.RTCRtpTransceiver && "currentDirection" in window2.RTCRtpTransceiver.prototype;
  } else {
    result.browser = "Not a supported browser.";
    return result;
  }
  return result;
}
var isObject = function(val) {
  return Object.prototype.toString.call(val) === "[object Object]";
};
function compactObject(data) {
  if (!isObject(data)) {
    return data;
  }
  return Object.keys(data).reduce(function(accumulator, key) {
    const isObj = isObject(data[key]);
    const value = isObj ? compactObject(data[key]) : data[key];
    const isEmptyObject = isObj && !Object.keys(value).length;
    if (value === undefined || isEmptyObject) {
      return accumulator;
    }
    return Object.assign(accumulator, { [key]: value });
  }, {});
}
function walkStats(stats, base, resultSet) {
  if (!base || resultSet.has(base.id)) {
    return;
  }
  resultSet.set(base.id, base);
  Object.keys(base).forEach((name) => {
    if (name.endsWith("Id")) {
      walkStats(stats, stats.get(base[name]), resultSet);
    } else if (name.endsWith("Ids")) {
      base[name].forEach((id) => {
        walkStats(stats, stats.get(id), resultSet);
      });
    }
  });
}
function filterStats(result, track, outbound) {
  const streamStatsType = outbound ? "outbound-rtp" : "inbound-rtp";
  const filteredResult = new Map;
  if (track === null) {
    return filteredResult;
  }
  const trackStats = [];
  result.forEach((value) => {
    if (value.type === "track" && value.trackIdentifier === track.id) {
      trackStats.push(value);
    }
  });
  trackStats.forEach((trackStat) => {
    result.forEach((stats) => {
      if (stats.type === streamStatsType && stats.trackId === trackStat.id) {
        walkStats(result, stats, filteredResult);
      }
    });
  });
  return filteredResult;
}
var logDisabled_ = true;
var deprecationWarnings_ = true;

// node_modules/webrtc-adapter/src/js/chrome/chrome_shim.js
var exports_chrome_shim = {};
__export(exports_chrome_shim, {
  shimSenderReceiverGetStats: () => shimSenderReceiverGetStats,
  shimPeerConnection: () => shimPeerConnection,
  shimOnTrack: () => shimOnTrack,
  shimMediaStream: () => shimMediaStream,
  shimGetUserMedia: () => shimGetUserMedia,
  shimGetStats: () => shimGetStats,
  shimGetSendersWithDtmf: () => shimGetSendersWithDtmf,
  shimGetDisplayMedia: () => shimGetDisplayMedia,
  shimAddTrackRemoveTrackWithNative: () => shimAddTrackRemoveTrackWithNative,
  shimAddTrackRemoveTrack: () => shimAddTrackRemoveTrack,
  fixNegotiationNeeded: () => fixNegotiationNeeded
});

// node_modules/webrtc-adapter/src/js/chrome/getusermedia.js
function shimGetUserMedia(window2) {
  const navigator2 = window2 && window2.navigator;
  if (!navigator2.mediaDevices) {
    return;
  }
  const browserDetails = detectBrowser(window2);
  const constraintsToChrome_ = function(c) {
    if (typeof c !== "object" || c.mandatory || c.optional) {
      return c;
    }
    const cc = {};
    Object.keys(c).forEach((key) => {
      if (key === "require" || key === "advanced" || key === "mediaSource") {
        return;
      }
      const r = typeof c[key] === "object" ? c[key] : { ideal: c[key] };
      if (r.exact !== undefined && typeof r.exact === "number") {
        r.min = r.max = r.exact;
      }
      const oldname_ = function(prefix, name) {
        if (prefix) {
          return prefix + name.charAt(0).toUpperCase() + name.slice(1);
        }
        return name === "deviceId" ? "sourceId" : name;
      };
      if (r.ideal !== undefined) {
        cc.optional = cc.optional || [];
        let oc = {};
        if (typeof r.ideal === "number") {
          oc[oldname_("min", key)] = r.ideal;
          cc.optional.push(oc);
          oc = {};
          oc[oldname_("max", key)] = r.ideal;
          cc.optional.push(oc);
        } else {
          oc[oldname_("", key)] = r.ideal;
          cc.optional.push(oc);
        }
      }
      if (r.exact !== undefined && typeof r.exact !== "number") {
        cc.mandatory = cc.mandatory || {};
        cc.mandatory[oldname_("", key)] = r.exact;
      } else {
        ["min", "max"].forEach((mix) => {
          if (r[mix] !== undefined) {
            cc.mandatory = cc.mandatory || {};
            cc.mandatory[oldname_(mix, key)] = r[mix];
          }
        });
      }
    });
    if (c.advanced) {
      cc.optional = (cc.optional || []).concat(c.advanced);
    }
    return cc;
  };
  const shimConstraints_ = function(constraints, func) {
    if (browserDetails.version >= 61) {
      return func(constraints);
    }
    constraints = JSON.parse(JSON.stringify(constraints));
    if (constraints && typeof constraints.audio === "object") {
      const remap = function(obj, a, b) {
        if (a in obj && !(b in obj)) {
          obj[b] = obj[a];
          delete obj[a];
        }
      };
      constraints = JSON.parse(JSON.stringify(constraints));
      remap(constraints.audio, "autoGainControl", "googAutoGainControl");
      remap(constraints.audio, "noiseSuppression", "googNoiseSuppression");
      constraints.audio = constraintsToChrome_(constraints.audio);
    }
    if (constraints && typeof constraints.video === "object") {
      let face = constraints.video.facingMode;
      face = face && (typeof face === "object" ? face : { ideal: face });
      const getSupportedFacingModeLies = browserDetails.version < 66;
      if (face && (face.exact === "user" || face.exact === "environment" || face.ideal === "user" || face.ideal === "environment") && !(navigator2.mediaDevices.getSupportedConstraints && navigator2.mediaDevices.getSupportedConstraints().facingMode && !getSupportedFacingModeLies)) {
        delete constraints.video.facingMode;
        let matches;
        if (face.exact === "environment" || face.ideal === "environment") {
          matches = ["back", "rear"];
        } else if (face.exact === "user" || face.ideal === "user") {
          matches = ["front"];
        }
        if (matches) {
          return navigator2.mediaDevices.enumerateDevices().then((devices) => {
            devices = devices.filter((d) => d.kind === "videoinput");
            let dev = devices.find((d) => matches.some((match) => d.label.toLowerCase().includes(match)));
            if (!dev && devices.length && matches.includes("back")) {
              dev = devices[devices.length - 1];
            }
            if (dev) {
              constraints.video.deviceId = face.exact ? { exact: dev.deviceId } : { ideal: dev.deviceId };
            }
            constraints.video = constraintsToChrome_(constraints.video);
            logging("chrome: " + JSON.stringify(constraints));
            return func(constraints);
          });
        }
      }
      constraints.video = constraintsToChrome_(constraints.video);
    }
    logging("chrome: " + JSON.stringify(constraints));
    return func(constraints);
  };
  const shimError_ = function(e) {
    if (browserDetails.version >= 64) {
      return e;
    }
    return {
      name: {
        PermissionDeniedError: "NotAllowedError",
        PermissionDismissedError: "NotAllowedError",
        InvalidStateError: "NotAllowedError",
        DevicesNotFoundError: "NotFoundError",
        ConstraintNotSatisfiedError: "OverconstrainedError",
        TrackStartError: "NotReadableError",
        MediaDeviceFailedDueToShutdown: "NotAllowedError",
        MediaDeviceKillSwitchOn: "NotAllowedError",
        TabCaptureError: "AbortError",
        ScreenCaptureError: "AbortError",
        DeviceCaptureError: "AbortError"
      }[e.name] || e.name,
      message: e.message,
      constraint: e.constraint || e.constraintName,
      toString() {
        return this.name + (this.message && ": ") + this.message;
      }
    };
  };
  const getUserMedia_ = function(constraints, onSuccess, onError) {
    shimConstraints_(constraints, (c) => {
      navigator2.webkitGetUserMedia(c, onSuccess, (e) => {
        if (onError) {
          onError(shimError_(e));
        }
      });
    });
  };
  navigator2.getUserMedia = getUserMedia_.bind(navigator2);
  if (navigator2.mediaDevices.getUserMedia) {
    const origGetUserMedia = navigator2.mediaDevices.getUserMedia.bind(navigator2.mediaDevices);
    navigator2.mediaDevices.getUserMedia = function(cs) {
      return shimConstraints_(cs, (c) => origGetUserMedia(c).then((stream) => {
        if (c.audio && !stream.getAudioTracks().length || c.video && !stream.getVideoTracks().length) {
          stream.getTracks().forEach((track) => {
            track.stop();
          });
          throw new DOMException("", "NotFoundError");
        }
        return stream;
      }, (e) => Promise.reject(shimError_(e))));
    };
  }
}
var logging = log;
// node_modules/webrtc-adapter/src/js/chrome/getdisplaymedia.js
function shimGetDisplayMedia(window2, getSourceId) {
  if (window2.navigator.mediaDevices && "getDisplayMedia" in window2.navigator.mediaDevices) {
    return;
  }
  if (!window2.navigator.mediaDevices) {
    return;
  }
  if (typeof getSourceId !== "function") {
    console.error("shimGetDisplayMedia: getSourceId argument is not " + "a function");
    return;
  }
  window2.navigator.mediaDevices.getDisplayMedia = function getDisplayMedia(constraints) {
    return getSourceId(constraints).then((sourceId) => {
      const widthSpecified = constraints.video && constraints.video.width;
      const heightSpecified = constraints.video && constraints.video.height;
      const frameRateSpecified = constraints.video && constraints.video.frameRate;
      constraints.video = {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: sourceId,
          maxFrameRate: frameRateSpecified || 3
        }
      };
      if (widthSpecified) {
        constraints.video.mandatory.maxWidth = widthSpecified;
      }
      if (heightSpecified) {
        constraints.video.mandatory.maxHeight = heightSpecified;
      }
      return window2.navigator.mediaDevices.getUserMedia(constraints);
    });
  };
}

// node_modules/webrtc-adapter/src/js/chrome/chrome_shim.js
function shimMediaStream(window2) {
  window2.MediaStream = window2.MediaStream || window2.webkitMediaStream;
}
function shimOnTrack(window2) {
  if (typeof window2 === "object" && window2.RTCPeerConnection && !("ontrack" in window2.RTCPeerConnection.prototype)) {
    Object.defineProperty(window2.RTCPeerConnection.prototype, "ontrack", {
      get() {
        return this._ontrack;
      },
      set(f) {
        if (this._ontrack) {
          this.removeEventListener("track", this._ontrack);
        }
        this.addEventListener("track", this._ontrack = f);
      },
      enumerable: true,
      configurable: true
    });
    const origSetRemoteDescription = window2.RTCPeerConnection.prototype.setRemoteDescription;
    window2.RTCPeerConnection.prototype.setRemoteDescription = function setRemoteDescription() {
      if (!this._ontrackpoly) {
        this._ontrackpoly = (e) => {
          e.stream.addEventListener("addtrack", (te) => {
            let receiver;
            if (window2.RTCPeerConnection.prototype.getReceivers) {
              receiver = this.getReceivers().find((r) => r.track && r.track.id === te.track.id);
            } else {
              receiver = { track: te.track };
            }
            const event = new Event("track");
            event.track = te.track;
            event.receiver = receiver;
            event.transceiver = { receiver };
            event.streams = [e.stream];
            this.dispatchEvent(event);
          });
          e.stream.getTracks().forEach((track) => {
            let receiver;
            if (window2.RTCPeerConnection.prototype.getReceivers) {
              receiver = this.getReceivers().find((r) => r.track && r.track.id === track.id);
            } else {
              receiver = { track };
            }
            const event = new Event("track");
            event.track = track;
            event.receiver = receiver;
            event.transceiver = { receiver };
            event.streams = [e.stream];
            this.dispatchEvent(event);
          });
        };
        this.addEventListener("addstream", this._ontrackpoly);
      }
      return origSetRemoteDescription.apply(this, arguments);
    };
  } else {
    wrapPeerConnectionEvent(window2, "track", (e) => {
      if (!e.transceiver) {
        Object.defineProperty(e, "transceiver", { value: { receiver: e.receiver } });
      }
      return e;
    });
  }
}
function shimGetSendersWithDtmf(window2) {
  if (typeof window2 === "object" && window2.RTCPeerConnection && !("getSenders" in window2.RTCPeerConnection.prototype) && "createDTMFSender" in window2.RTCPeerConnection.prototype) {
    const shimSenderWithDtmf = function(pc, track) {
      return {
        track,
        get dtmf() {
          if (this._dtmf === undefined) {
            if (track.kind === "audio") {
              this._dtmf = pc.createDTMFSender(track);
            } else {
              this._dtmf = null;
            }
          }
          return this._dtmf;
        },
        _pc: pc
      };
    };
    if (!window2.RTCPeerConnection.prototype.getSenders) {
      window2.RTCPeerConnection.prototype.getSenders = function getSenders() {
        this._senders = this._senders || [];
        return this._senders.slice();
      };
      const origAddTrack = window2.RTCPeerConnection.prototype.addTrack;
      window2.RTCPeerConnection.prototype.addTrack = function addTrack(track, stream) {
        let sender = origAddTrack.apply(this, arguments);
        if (!sender) {
          sender = shimSenderWithDtmf(this, track);
          this._senders.push(sender);
        }
        return sender;
      };
      const origRemoveTrack = window2.RTCPeerConnection.prototype.removeTrack;
      window2.RTCPeerConnection.prototype.removeTrack = function removeTrack(sender) {
        origRemoveTrack.apply(this, arguments);
        const idx = this._senders.indexOf(sender);
        if (idx !== -1) {
          this._senders.splice(idx, 1);
        }
      };
    }
    const origAddStream = window2.RTCPeerConnection.prototype.addStream;
    window2.RTCPeerConnection.prototype.addStream = function addStream(stream) {
      this._senders = this._senders || [];
      origAddStream.apply(this, [stream]);
      stream.getTracks().forEach((track) => {
        this._senders.push(shimSenderWithDtmf(this, track));
      });
    };
    const origRemoveStream = window2.RTCPeerConnection.prototype.removeStream;
    window2.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
      this._senders = this._senders || [];
      origRemoveStream.apply(this, [stream]);
      stream.getTracks().forEach((track) => {
        const sender = this._senders.find((s) => s.track === track);
        if (sender) {
          this._senders.splice(this._senders.indexOf(sender), 1);
        }
      });
    };
  } else if (typeof window2 === "object" && window2.RTCPeerConnection && "getSenders" in window2.RTCPeerConnection.prototype && "createDTMFSender" in window2.RTCPeerConnection.prototype && window2.RTCRtpSender && !("dtmf" in window2.RTCRtpSender.prototype)) {
    const origGetSenders = window2.RTCPeerConnection.prototype.getSenders;
    window2.RTCPeerConnection.prototype.getSenders = function getSenders() {
      const senders = origGetSenders.apply(this, []);
      senders.forEach((sender) => sender._pc = this);
      return senders;
    };
    Object.defineProperty(window2.RTCRtpSender.prototype, "dtmf", {
      get() {
        if (this._dtmf === undefined) {
          if (this.track.kind === "audio") {
            this._dtmf = this._pc.createDTMFSender(this.track);
          } else {
            this._dtmf = null;
          }
        }
        return this._dtmf;
      }
    });
  }
}
function shimGetStats(window2) {
  if (!window2.RTCPeerConnection) {
    return;
  }
  const origGetStats = window2.RTCPeerConnection.prototype.getStats;
  window2.RTCPeerConnection.prototype.getStats = function getStats() {
    const [selector, onSucc, onErr] = arguments;
    if (arguments.length > 0 && typeof selector === "function") {
      return origGetStats.apply(this, arguments);
    }
    if (origGetStats.length === 0 && (arguments.length === 0 || typeof selector !== "function")) {
      return origGetStats.apply(this, []);
    }
    const fixChromeStats_ = function(response) {
      const standardReport = {};
      const reports = response.result();
      reports.forEach((report) => {
        const standardStats = {
          id: report.id,
          timestamp: report.timestamp,
          type: {
            localcandidate: "local-candidate",
            remotecandidate: "remote-candidate"
          }[report.type] || report.type
        };
        report.names().forEach((name) => {
          standardStats[name] = report.stat(name);
        });
        standardReport[standardStats.id] = standardStats;
      });
      return standardReport;
    };
    const makeMapStats = function(stats) {
      return new Map(Object.keys(stats).map((key) => [key, stats[key]]));
    };
    if (arguments.length >= 2) {
      const successCallbackWrapper_ = function(response) {
        onSucc(makeMapStats(fixChromeStats_(response)));
      };
      return origGetStats.apply(this, [
        successCallbackWrapper_,
        selector
      ]);
    }
    return new Promise((resolve, reject) => {
      origGetStats.apply(this, [
        function(response) {
          resolve(makeMapStats(fixChromeStats_(response)));
        },
        reject
      ]);
    }).then(onSucc, onErr);
  };
}
function shimSenderReceiverGetStats(window2) {
  if (!(typeof window2 === "object" && window2.RTCPeerConnection && window2.RTCRtpSender && window2.RTCRtpReceiver)) {
    return;
  }
  if (!("getStats" in window2.RTCRtpSender.prototype)) {
    const origGetSenders = window2.RTCPeerConnection.prototype.getSenders;
    if (origGetSenders) {
      window2.RTCPeerConnection.prototype.getSenders = function getSenders() {
        const senders = origGetSenders.apply(this, []);
        senders.forEach((sender) => sender._pc = this);
        return senders;
      };
    }
    const origAddTrack = window2.RTCPeerConnection.prototype.addTrack;
    if (origAddTrack) {
      window2.RTCPeerConnection.prototype.addTrack = function addTrack() {
        const sender = origAddTrack.apply(this, arguments);
        sender._pc = this;
        return sender;
      };
    }
    window2.RTCRtpSender.prototype.getStats = function getStats() {
      const sender = this;
      return this._pc.getStats().then((result) => filterStats(result, sender.track, true));
    };
  }
  if (!("getStats" in window2.RTCRtpReceiver.prototype)) {
    const origGetReceivers = window2.RTCPeerConnection.prototype.getReceivers;
    if (origGetReceivers) {
      window2.RTCPeerConnection.prototype.getReceivers = function getReceivers() {
        const receivers = origGetReceivers.apply(this, []);
        receivers.forEach((receiver) => receiver._pc = this);
        return receivers;
      };
    }
    wrapPeerConnectionEvent(window2, "track", (e) => {
      e.receiver._pc = e.srcElement;
      return e;
    });
    window2.RTCRtpReceiver.prototype.getStats = function getStats() {
      const receiver = this;
      return this._pc.getStats().then((result) => filterStats(result, receiver.track, false));
    };
  }
  if (!(("getStats" in window2.RTCRtpSender.prototype) && ("getStats" in window2.RTCRtpReceiver.prototype))) {
    return;
  }
  const origGetStats = window2.RTCPeerConnection.prototype.getStats;
  window2.RTCPeerConnection.prototype.getStats = function getStats() {
    if (arguments.length > 0 && arguments[0] instanceof window2.MediaStreamTrack) {
      const track = arguments[0];
      let sender;
      let receiver;
      let err;
      this.getSenders().forEach((s) => {
        if (s.track === track) {
          if (sender) {
            err = true;
          } else {
            sender = s;
          }
        }
      });
      this.getReceivers().forEach((r) => {
        if (r.track === track) {
          if (receiver) {
            err = true;
          } else {
            receiver = r;
          }
        }
        return r.track === track;
      });
      if (err || sender && receiver) {
        return Promise.reject(new DOMException("There are more than one sender or receiver for the track.", "InvalidAccessError"));
      } else if (sender) {
        return sender.getStats();
      } else if (receiver) {
        return receiver.getStats();
      }
      return Promise.reject(new DOMException("There is no sender or receiver for the track.", "InvalidAccessError"));
    }
    return origGetStats.apply(this, arguments);
  };
}
function shimAddTrackRemoveTrackWithNative(window2) {
  window2.RTCPeerConnection.prototype.getLocalStreams = function getLocalStreams() {
    this._shimmedLocalStreams = this._shimmedLocalStreams || {};
    return Object.keys(this._shimmedLocalStreams).map((streamId) => this._shimmedLocalStreams[streamId][0]);
  };
  const origAddTrack = window2.RTCPeerConnection.prototype.addTrack;
  window2.RTCPeerConnection.prototype.addTrack = function addTrack(track, stream) {
    if (!stream) {
      return origAddTrack.apply(this, arguments);
    }
    this._shimmedLocalStreams = this._shimmedLocalStreams || {};
    const sender = origAddTrack.apply(this, arguments);
    if (!this._shimmedLocalStreams[stream.id]) {
      this._shimmedLocalStreams[stream.id] = [stream, sender];
    } else if (this._shimmedLocalStreams[stream.id].indexOf(sender) === -1) {
      this._shimmedLocalStreams[stream.id].push(sender);
    }
    return sender;
  };
  const origAddStream = window2.RTCPeerConnection.prototype.addStream;
  window2.RTCPeerConnection.prototype.addStream = function addStream(stream) {
    this._shimmedLocalStreams = this._shimmedLocalStreams || {};
    stream.getTracks().forEach((track) => {
      const alreadyExists = this.getSenders().find((s) => s.track === track);
      if (alreadyExists) {
        throw new DOMException("Track already exists.", "InvalidAccessError");
      }
    });
    const existingSenders = this.getSenders();
    origAddStream.apply(this, arguments);
    const newSenders = this.getSenders().filter((newSender) => existingSenders.indexOf(newSender) === -1);
    this._shimmedLocalStreams[stream.id] = [stream].concat(newSenders);
  };
  const origRemoveStream = window2.RTCPeerConnection.prototype.removeStream;
  window2.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
    this._shimmedLocalStreams = this._shimmedLocalStreams || {};
    delete this._shimmedLocalStreams[stream.id];
    return origRemoveStream.apply(this, arguments);
  };
  const origRemoveTrack = window2.RTCPeerConnection.prototype.removeTrack;
  window2.RTCPeerConnection.prototype.removeTrack = function removeTrack(sender) {
    this._shimmedLocalStreams = this._shimmedLocalStreams || {};
    if (sender) {
      Object.keys(this._shimmedLocalStreams).forEach((streamId) => {
        const idx = this._shimmedLocalStreams[streamId].indexOf(sender);
        if (idx !== -1) {
          this._shimmedLocalStreams[streamId].splice(idx, 1);
        }
        if (this._shimmedLocalStreams[streamId].length === 1) {
          delete this._shimmedLocalStreams[streamId];
        }
      });
    }
    return origRemoveTrack.apply(this, arguments);
  };
}
function shimAddTrackRemoveTrack(window2) {
  if (!window2.RTCPeerConnection) {
    return;
  }
  const browserDetails = detectBrowser(window2);
  if (window2.RTCPeerConnection.prototype.addTrack && browserDetails.version >= 65) {
    return shimAddTrackRemoveTrackWithNative(window2);
  }
  const origGetLocalStreams = window2.RTCPeerConnection.prototype.getLocalStreams;
  window2.RTCPeerConnection.prototype.getLocalStreams = function getLocalStreams() {
    const nativeStreams = origGetLocalStreams.apply(this);
    this._reverseStreams = this._reverseStreams || {};
    return nativeStreams.map((stream) => this._reverseStreams[stream.id]);
  };
  const origAddStream = window2.RTCPeerConnection.prototype.addStream;
  window2.RTCPeerConnection.prototype.addStream = function addStream(stream) {
    this._streams = this._streams || {};
    this._reverseStreams = this._reverseStreams || {};
    stream.getTracks().forEach((track) => {
      const alreadyExists = this.getSenders().find((s) => s.track === track);
      if (alreadyExists) {
        throw new DOMException("Track already exists.", "InvalidAccessError");
      }
    });
    if (!this._reverseStreams[stream.id]) {
      const newStream = new window2.MediaStream(stream.getTracks());
      this._streams[stream.id] = newStream;
      this._reverseStreams[newStream.id] = stream;
      stream = newStream;
    }
    origAddStream.apply(this, [stream]);
  };
  const origRemoveStream = window2.RTCPeerConnection.prototype.removeStream;
  window2.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
    this._streams = this._streams || {};
    this._reverseStreams = this._reverseStreams || {};
    origRemoveStream.apply(this, [this._streams[stream.id] || stream]);
    delete this._reverseStreams[this._streams[stream.id] ? this._streams[stream.id].id : stream.id];
    delete this._streams[stream.id];
  };
  window2.RTCPeerConnection.prototype.addTrack = function addTrack(track, stream) {
    if (this.signalingState === "closed") {
      throw new DOMException("The RTCPeerConnection\'s signalingState is \'closed\'.", "InvalidStateError");
    }
    const streams = [].slice.call(arguments, 1);
    if (streams.length !== 1 || !streams[0].getTracks().find((t) => t === track)) {
      throw new DOMException("The adapter.js addTrack polyfill only supports a single " + " stream which is associated with the specified track.", "NotSupportedError");
    }
    const alreadyExists = this.getSenders().find((s) => s.track === track);
    if (alreadyExists) {
      throw new DOMException("Track already exists.", "InvalidAccessError");
    }
    this._streams = this._streams || {};
    this._reverseStreams = this._reverseStreams || {};
    const oldStream = this._streams[stream.id];
    if (oldStream) {
      oldStream.addTrack(track);
      Promise.resolve().then(() => {
        this.dispatchEvent(new Event("negotiationneeded"));
      });
    } else {
      const newStream = new window2.MediaStream([track]);
      this._streams[stream.id] = newStream;
      this._reverseStreams[newStream.id] = stream;
      this.addStream(newStream);
    }
    return this.getSenders().find((s) => s.track === track);
  };
  function replaceInternalStreamId(pc, description) {
    let sdp = description.sdp;
    Object.keys(pc._reverseStreams || []).forEach((internalId) => {
      const externalStream = pc._reverseStreams[internalId];
      const internalStream = pc._streams[externalStream.id];
      sdp = sdp.replace(new RegExp(internalStream.id, "g"), externalStream.id);
    });
    return new RTCSessionDescription({
      type: description.type,
      sdp
    });
  }
  function replaceExternalStreamId(pc, description) {
    let sdp = description.sdp;
    Object.keys(pc._reverseStreams || []).forEach((internalId) => {
      const externalStream = pc._reverseStreams[internalId];
      const internalStream = pc._streams[externalStream.id];
      sdp = sdp.replace(new RegExp(externalStream.id, "g"), internalStream.id);
    });
    return new RTCSessionDescription({
      type: description.type,
      sdp
    });
  }
  ["createOffer", "createAnswer"].forEach(function(method) {
    const nativeMethod = window2.RTCPeerConnection.prototype[method];
    const methodObj = { [method]() {
      const args = arguments;
      const isLegacyCall = arguments.length && typeof arguments[0] === "function";
      if (isLegacyCall) {
        return nativeMethod.apply(this, [
          (description) => {
            const desc = replaceInternalStreamId(this, description);
            args[0].apply(null, [desc]);
          },
          (err) => {
            if (args[1]) {
              args[1].apply(null, err);
            }
          },
          arguments[2]
        ]);
      }
      return nativeMethod.apply(this, arguments).then((description) => replaceInternalStreamId(this, description));
    } };
    window2.RTCPeerConnection.prototype[method] = methodObj[method];
  });
  const origSetLocalDescription = window2.RTCPeerConnection.prototype.setLocalDescription;
  window2.RTCPeerConnection.prototype.setLocalDescription = function setLocalDescription() {
    if (!arguments.length || !arguments[0].type) {
      return origSetLocalDescription.apply(this, arguments);
    }
    arguments[0] = replaceExternalStreamId(this, arguments[0]);
    return origSetLocalDescription.apply(this, arguments);
  };
  const origLocalDescription = Object.getOwnPropertyDescriptor(window2.RTCPeerConnection.prototype, "localDescription");
  Object.defineProperty(window2.RTCPeerConnection.prototype, "localDescription", {
    get() {
      const description = origLocalDescription.get.apply(this);
      if (description.type === "") {
        return description;
      }
      return replaceInternalStreamId(this, description);
    }
  });
  window2.RTCPeerConnection.prototype.removeTrack = function removeTrack(sender) {
    if (this.signalingState === "closed") {
      throw new DOMException("The RTCPeerConnection\'s signalingState is \'closed\'.", "InvalidStateError");
    }
    if (!sender._pc) {
      throw new DOMException("Argument 1 of RTCPeerConnection.removeTrack " + "does not implement interface RTCRtpSender.", "TypeError");
    }
    const isLocal = sender._pc === this;
    if (!isLocal) {
      throw new DOMException("Sender was not created by this connection.", "InvalidAccessError");
    }
    this._streams = this._streams || {};
    let stream;
    Object.keys(this._streams).forEach((streamid) => {
      const hasTrack = this._streams[streamid].getTracks().find((track) => sender.track === track);
      if (hasTrack) {
        stream = this._streams[streamid];
      }
    });
    if (stream) {
      if (stream.getTracks().length === 1) {
        this.removeStream(this._reverseStreams[stream.id]);
      } else {
        stream.removeTrack(sender.track);
      }
      this.dispatchEvent(new Event("negotiationneeded"));
    }
  };
}
function shimPeerConnection(window2) {
  const browserDetails = detectBrowser(window2);
  if (!window2.RTCPeerConnection && window2.webkitRTCPeerConnection) {
    window2.RTCPeerConnection = window2.webkitRTCPeerConnection;
  }
  if (!window2.RTCPeerConnection) {
    return;
  }
  const addIceCandidateNullSupported = window2.RTCPeerConnection.prototype.addIceCandidate.length === 0;
  if (browserDetails.version < 53) {
    ["setLocalDescription", "setRemoteDescription", "addIceCandidate"].forEach(function(method) {
      const nativeMethod = window2.RTCPeerConnection.prototype[method];
      const methodObj = { [method]() {
        arguments[0] = new (method === "addIceCandidate" ? window2.RTCIceCandidate : window2.RTCSessionDescription)(arguments[0]);
        return nativeMethod.apply(this, arguments);
      } };
      window2.RTCPeerConnection.prototype[method] = methodObj[method];
    });
  }
  const nativeAddIceCandidate = window2.RTCPeerConnection.prototype.addIceCandidate;
  window2.RTCPeerConnection.prototype.addIceCandidate = function addIceCandidate() {
    if (!addIceCandidateNullSupported && !arguments[0]) {
      if (arguments[1]) {
        arguments[1].apply(null);
      }
      return Promise.resolve();
    }
    if (browserDetails.version < 78 && arguments[0] && arguments[0].candidate === "") {
      return Promise.resolve();
    }
    return nativeAddIceCandidate.apply(this, arguments);
  };
}
function fixNegotiationNeeded(window2) {
  wrapPeerConnectionEvent(window2, "negotiationneeded", (e) => {
    const pc = e.target;
    if (pc.signalingState !== "stable") {
      return;
    }
    return e;
  });
}

// node_modules/webrtc-adapter/src/js/edge/edge_shim.js
var exports_edge_shim = {};
__export(exports_edge_shim, {
  shimReplaceTrack: () => shimReplaceTrack,
  shimPeerConnection: () => shimPeerConnection2,
  shimGetUserMedia: () => shimGetUserMedia2,
  shimGetDisplayMedia: () => shimGetDisplayMedia2
});

// node_modules/webrtc-adapter/src/js/edge/filtericeservers.js
function filterIceServers(iceServers, edgeVersion) {
  let hasTurn = false;
  iceServers = JSON.parse(JSON.stringify(iceServers));
  return iceServers.filter((server) => {
    if (server && (server.urls || server.url)) {
      var urls = server.urls || server.url;
      if (server.url && !server.urls) {
        deprecated("RTCIceServer.url", "RTCIceServer.urls");
      }
      const isString = typeof urls === "string";
      if (isString) {
        urls = [urls];
      }
      urls = urls.filter((url) => {
        if (url.indexOf("stun:") === 0) {
          return false;
        }
        const validTurn = url.startsWith("turn") && !url.startsWith("turn:[") && url.includes("transport=udp");
        if (validTurn && !hasTurn) {
          hasTurn = true;
          return true;
        }
        return validTurn && !hasTurn;
      });
      delete server.url;
      server.urls = isString ? urls[0] : urls;
      return !!urls.length;
    }
  });
}

// node_modules/webrtc-adapter/src/js/edge/edge_shim.js
var import_rtcpeerconnection_shim = __toESM(require_rtcpeerconnection(), 1);

// node_modules/webrtc-adapter/src/js/edge/getusermedia.js
function shimGetUserMedia2(window2) {
  const navigator2 = window2 && window2.navigator;
  const shimError_ = function(e) {
    return {
      name: { PermissionDeniedError: "NotAllowedError" }[e.name] || e.name,
      message: e.message,
      constraint: e.constraint,
      toString() {
        return this.name;
      }
    };
  };
  const origGetUserMedia = navigator2.mediaDevices.getUserMedia.bind(navigator2.mediaDevices);
  navigator2.mediaDevices.getUserMedia = function(c) {
    return origGetUserMedia(c).catch((e) => Promise.reject(shimError_(e)));
  };
}
// node_modules/webrtc-adapter/src/js/edge/getdisplaymedia.js
function shimGetDisplayMedia2(window2) {
  if (!("getDisplayMedia" in window2.navigator)) {
    return;
  }
  if (!window2.navigator.mediaDevices) {
    return;
  }
  if (window2.navigator.mediaDevices && "getDisplayMedia" in window2.navigator.mediaDevices) {
    return;
  }
  window2.navigator.mediaDevices.getDisplayMedia = window2.navigator.getDisplayMedia.bind(window2.navigator);
}

// node_modules/webrtc-adapter/src/js/edge/edge_shim.js
function shimPeerConnection2(window2) {
  const browserDetails = detectBrowser(window2);
  if (window2.RTCIceGatherer) {
    if (!window2.RTCIceCandidate) {
      window2.RTCIceCandidate = function RTCIceCandidate(args) {
        return args;
      };
    }
    if (!window2.RTCSessionDescription) {
      window2.RTCSessionDescription = function RTCSessionDescription(args) {
        return args;
      };
    }
    if (browserDetails.version < 15025) {
      const origMSTEnabled = Object.getOwnPropertyDescriptor(window2.MediaStreamTrack.prototype, "enabled");
      Object.defineProperty(window2.MediaStreamTrack.prototype, "enabled", {
        set(value) {
          origMSTEnabled.set.call(this, value);
          const ev = new Event("enabled");
          ev.enabled = value;
          this.dispatchEvent(ev);
        }
      });
    }
  }
  if (window2.RTCRtpSender && !("dtmf" in window2.RTCRtpSender.prototype)) {
    Object.defineProperty(window2.RTCRtpSender.prototype, "dtmf", {
      get() {
        if (this._dtmf === undefined) {
          if (this.track.kind === "audio") {
            this._dtmf = new window2.RTCDtmfSender(this);
          } else if (this.track.kind === "video") {
            this._dtmf = null;
          }
        }
        return this._dtmf;
      }
    });
  }
  if (window2.RTCDtmfSender && !window2.RTCDTMFSender) {
    window2.RTCDTMFSender = window2.RTCDtmfSender;
  }
  const RTCPeerConnectionShim = import_rtcpeerconnection_shim.default(window2, browserDetails.version);
  window2.RTCPeerConnection = function RTCPeerConnection(config) {
    if (config && config.iceServers) {
      config.iceServers = filterIceServers(config.iceServers, browserDetails.version);
      log("ICE servers after filtering:", config.iceServers);
    }
    return new RTCPeerConnectionShim(config);
  };
  window2.RTCPeerConnection.prototype = RTCPeerConnectionShim.prototype;
}
function shimReplaceTrack(window2) {
  if (window2.RTCRtpSender && !("replaceTrack" in window2.RTCRtpSender.prototype)) {
    window2.RTCRtpSender.prototype.replaceTrack = window2.RTCRtpSender.prototype.setTrack;
  }
}

// node_modules/webrtc-adapter/src/js/firefox/firefox_shim.js
var exports_firefox_shim = {};
__export(exports_firefox_shim, {
  shimSenderGetStats: () => shimSenderGetStats,
  shimRemoveStream: () => shimRemoveStream,
  shimReceiverGetStats: () => shimReceiverGetStats,
  shimRTCDataChannel: () => shimRTCDataChannel,
  shimPeerConnection: () => shimPeerConnection3,
  shimOnTrack: () => shimOnTrack2,
  shimGetUserMedia: () => shimGetUserMedia3,
  shimGetDisplayMedia: () => shimGetDisplayMedia3,
  shimCreateOffer: () => shimCreateOffer,
  shimCreateAnswer: () => shimCreateAnswer,
  shimAddTransceiver: () => shimAddTransceiver
});

// node_modules/webrtc-adapter/src/js/firefox/getusermedia.js
function shimGetUserMedia3(window2) {
  const browserDetails = detectBrowser(window2);
  const navigator2 = window2 && window2.navigator;
  const MediaStreamTrack = window2 && window2.MediaStreamTrack;
  navigator2.getUserMedia = function(constraints, onSuccess, onError) {
    deprecated("navigator.getUserMedia", "navigator.mediaDevices.getUserMedia");
    navigator2.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
  };
  if (!(browserDetails.version > 55 && ("autoGainControl" in navigator2.mediaDevices.getSupportedConstraints()))) {
    const remap = function(obj, a, b) {
      if (a in obj && !(b in obj)) {
        obj[b] = obj[a];
        delete obj[a];
      }
    };
    const nativeGetUserMedia = navigator2.mediaDevices.getUserMedia.bind(navigator2.mediaDevices);
    navigator2.mediaDevices.getUserMedia = function(c) {
      if (typeof c === "object" && typeof c.audio === "object") {
        c = JSON.parse(JSON.stringify(c));
        remap(c.audio, "autoGainControl", "mozAutoGainControl");
        remap(c.audio, "noiseSuppression", "mozNoiseSuppression");
      }
      return nativeGetUserMedia(c);
    };
    if (MediaStreamTrack && MediaStreamTrack.prototype.getSettings) {
      const nativeGetSettings = MediaStreamTrack.prototype.getSettings;
      MediaStreamTrack.prototype.getSettings = function() {
        const obj = nativeGetSettings.apply(this, arguments);
        remap(obj, "mozAutoGainControl", "autoGainControl");
        remap(obj, "mozNoiseSuppression", "noiseSuppression");
        return obj;
      };
    }
    if (MediaStreamTrack && MediaStreamTrack.prototype.applyConstraints) {
      const nativeApplyConstraints = MediaStreamTrack.prototype.applyConstraints;
      MediaStreamTrack.prototype.applyConstraints = function(c) {
        if (this.kind === "audio" && typeof c === "object") {
          c = JSON.parse(JSON.stringify(c));
          remap(c, "autoGainControl", "mozAutoGainControl");
          remap(c, "noiseSuppression", "mozNoiseSuppression");
        }
        return nativeApplyConstraints.apply(this, [c]);
      };
    }
  }
}
// node_modules/webrtc-adapter/src/js/firefox/getdisplaymedia.js
function shimGetDisplayMedia3(window2, preferredMediaSource) {
  if (window2.navigator.mediaDevices && "getDisplayMedia" in window2.navigator.mediaDevices) {
    return;
  }
  if (!window2.navigator.mediaDevices) {
    return;
  }
  window2.navigator.mediaDevices.getDisplayMedia = function getDisplayMedia(constraints) {
    if (!(constraints && constraints.video)) {
      const err = new DOMException("getDisplayMedia without video " + "constraints is undefined");
      err.name = "NotFoundError";
      err.code = 8;
      return Promise.reject(err);
    }
    if (constraints.video === true) {
      constraints.video = { mediaSource: preferredMediaSource };
    } else {
      constraints.video.mediaSource = preferredMediaSource;
    }
    return window2.navigator.mediaDevices.getUserMedia(constraints);
  };
}

// node_modules/webrtc-adapter/src/js/firefox/firefox_shim.js
function shimOnTrack2(window2) {
  if (typeof window2 === "object" && window2.RTCTrackEvent && "receiver" in window2.RTCTrackEvent.prototype && !("transceiver" in window2.RTCTrackEvent.prototype)) {
    Object.defineProperty(window2.RTCTrackEvent.prototype, "transceiver", {
      get() {
        return { receiver: this.receiver };
      }
    });
  }
}
function shimPeerConnection3(window2) {
  const browserDetails = detectBrowser(window2);
  if (typeof window2 !== "object" || !(window2.RTCPeerConnection || window2.mozRTCPeerConnection)) {
    return;
  }
  if (!window2.RTCPeerConnection && window2.mozRTCPeerConnection) {
    window2.RTCPeerConnection = window2.mozRTCPeerConnection;
  }
  if (browserDetails.version < 53) {
    ["setLocalDescription", "setRemoteDescription", "addIceCandidate"].forEach(function(method) {
      const nativeMethod = window2.RTCPeerConnection.prototype[method];
      const methodObj = { [method]() {
        arguments[0] = new (method === "addIceCandidate" ? window2.RTCIceCandidate : window2.RTCSessionDescription)(arguments[0]);
        return nativeMethod.apply(this, arguments);
      } };
      window2.RTCPeerConnection.prototype[method] = methodObj[method];
    });
  }
  if (browserDetails.version < 68) {
    const nativeAddIceCandidate = window2.RTCPeerConnection.prototype.addIceCandidate;
    window2.RTCPeerConnection.prototype.addIceCandidate = function addIceCandidate() {
      if (!arguments[0]) {
        if (arguments[1]) {
          arguments[1].apply(null);
        }
        return Promise.resolve();
      }
      if (arguments[0] && arguments[0].candidate === "") {
        return Promise.resolve();
      }
      return nativeAddIceCandidate.apply(this, arguments);
    };
  }
  const modernStatsTypes = {
    inboundrtp: "inbound-rtp",
    outboundrtp: "outbound-rtp",
    candidatepair: "candidate-pair",
    localcandidate: "local-candidate",
    remotecandidate: "remote-candidate"
  };
  const nativeGetStats = window2.RTCPeerConnection.prototype.getStats;
  window2.RTCPeerConnection.prototype.getStats = function getStats() {
    const [selector, onSucc, onErr] = arguments;
    return nativeGetStats.apply(this, [selector || null]).then((stats) => {
      if (browserDetails.version < 53 && !onSucc) {
        try {
          stats.forEach((stat) => {
            stat.type = modernStatsTypes[stat.type] || stat.type;
          });
        } catch (e) {
          if (e.name !== "TypeError") {
            throw e;
          }
          stats.forEach((stat, i) => {
            stats.set(i, Object.assign({}, stat, {
              type: modernStatsTypes[stat.type] || stat.type
            }));
          });
        }
      }
      return stats;
    }).then(onSucc, onErr);
  };
}
function shimSenderGetStats(window2) {
  if (!(typeof window2 === "object" && window2.RTCPeerConnection && window2.RTCRtpSender)) {
    return;
  }
  if (window2.RTCRtpSender && "getStats" in window2.RTCRtpSender.prototype) {
    return;
  }
  const origGetSenders = window2.RTCPeerConnection.prototype.getSenders;
  if (origGetSenders) {
    window2.RTCPeerConnection.prototype.getSenders = function getSenders() {
      const senders = origGetSenders.apply(this, []);
      senders.forEach((sender) => sender._pc = this);
      return senders;
    };
  }
  const origAddTrack = window2.RTCPeerConnection.prototype.addTrack;
  if (origAddTrack) {
    window2.RTCPeerConnection.prototype.addTrack = function addTrack() {
      const sender = origAddTrack.apply(this, arguments);
      sender._pc = this;
      return sender;
    };
  }
  window2.RTCRtpSender.prototype.getStats = function getStats() {
    return this.track ? this._pc.getStats(this.track) : Promise.resolve(new Map);
  };
}
function shimReceiverGetStats(window2) {
  if (!(typeof window2 === "object" && window2.RTCPeerConnection && window2.RTCRtpSender)) {
    return;
  }
  if (window2.RTCRtpSender && "getStats" in window2.RTCRtpReceiver.prototype) {
    return;
  }
  const origGetReceivers = window2.RTCPeerConnection.prototype.getReceivers;
  if (origGetReceivers) {
    window2.RTCPeerConnection.prototype.getReceivers = function getReceivers() {
      const receivers = origGetReceivers.apply(this, []);
      receivers.forEach((receiver) => receiver._pc = this);
      return receivers;
    };
  }
  wrapPeerConnectionEvent(window2, "track", (e) => {
    e.receiver._pc = e.srcElement;
    return e;
  });
  window2.RTCRtpReceiver.prototype.getStats = function getStats() {
    return this._pc.getStats(this.track);
  };
}
function shimRemoveStream(window2) {
  if (!window2.RTCPeerConnection || "removeStream" in window2.RTCPeerConnection.prototype) {
    return;
  }
  window2.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
    deprecated("removeStream", "removeTrack");
    this.getSenders().forEach((sender) => {
      if (sender.track && stream.getTracks().includes(sender.track)) {
        this.removeTrack(sender);
      }
    });
  };
}
function shimRTCDataChannel(window2) {
  if (window2.DataChannel && !window2.RTCDataChannel) {
    window2.RTCDataChannel = window2.DataChannel;
  }
}
function shimAddTransceiver(window2) {
  if (!(typeof window2 === "object" && window2.RTCPeerConnection)) {
    return;
  }
  const origAddTransceiver = window2.RTCPeerConnection.prototype.addTransceiver;
  if (origAddTransceiver) {
    window2.RTCPeerConnection.prototype.addTransceiver = function addTransceiver() {
      this.setParametersPromises = [];
      const initParameters = arguments[1];
      const shouldPerformCheck = initParameters && "sendEncodings" in initParameters;
      if (shouldPerformCheck) {
        initParameters.sendEncodings.forEach((encodingParam) => {
          if ("rid" in encodingParam) {
            const ridRegex = /^[a-z0-9]{0,16}$/i;
            if (!ridRegex.test(encodingParam.rid)) {
              throw new TypeError("Invalid RID value provided.");
            }
          }
          if ("scaleResolutionDownBy" in encodingParam) {
            if (!(parseFloat(encodingParam.scaleResolutionDownBy) >= 1)) {
              throw new RangeError("scale_resolution_down_by must be >= 1.0");
            }
          }
          if ("maxFramerate" in encodingParam) {
            if (!(parseFloat(encodingParam.maxFramerate) >= 0)) {
              throw new RangeError("max_framerate must be >= 0.0");
            }
          }
        });
      }
      const transceiver = origAddTransceiver.apply(this, arguments);
      if (shouldPerformCheck) {
        const { sender } = transceiver;
        const params = sender.getParameters();
        if (!("encodings" in params)) {
          params.encodings = initParameters.sendEncodings;
          this.setParametersPromises.push(sender.setParameters(params).catch(() => {
          }));
        }
      }
      return transceiver;
    };
  }
}
function shimCreateOffer(window2) {
  if (!(typeof window2 === "object" && window2.RTCPeerConnection)) {
    return;
  }
  const origCreateOffer = window2.RTCPeerConnection.prototype.createOffer;
  window2.RTCPeerConnection.prototype.createOffer = function createOffer() {
    if (this.setParametersPromises && this.setParametersPromises.length) {
      return Promise.all(this.setParametersPromises).then(() => {
        return origCreateOffer.apply(this, arguments);
      }).finally(() => {
        this.setParametersPromises = [];
      });
    }
    return origCreateOffer.apply(this, arguments);
  };
}
function shimCreateAnswer(window2) {
  if (!(typeof window2 === "object" && window2.RTCPeerConnection)) {
    return;
  }
  const origCreateAnswer = window2.RTCPeerConnection.prototype.createAnswer;
  window2.RTCPeerConnection.prototype.createAnswer = function createAnswer() {
    if (this.setParametersPromises && this.setParametersPromises.length) {
      return Promise.all(this.setParametersPromises).then(() => {
        return origCreateAnswer.apply(this, arguments);
      }).finally(() => {
        this.setParametersPromises = [];
      });
    }
    return origCreateAnswer.apply(this, arguments);
  };
}

// node_modules/webrtc-adapter/src/js/safari/safari_shim.js
var exports_safari_shim = {};
__export(exports_safari_shim, {
  shimTrackEventTransceiver: () => shimTrackEventTransceiver,
  shimRemoteStreamsAPI: () => shimRemoteStreamsAPI,
  shimRTCIceServerUrls: () => shimRTCIceServerUrls,
  shimLocalStreamsAPI: () => shimLocalStreamsAPI,
  shimGetUserMedia: () => shimGetUserMedia4,
  shimCreateOfferLegacy: () => shimCreateOfferLegacy,
  shimConstraints: () => shimConstraints,
  shimCallbacksAPI: () => shimCallbacksAPI
});
function shimLocalStreamsAPI(window2) {
  if (typeof window2 !== "object" || !window2.RTCPeerConnection) {
    return;
  }
  if (!("getLocalStreams" in window2.RTCPeerConnection.prototype)) {
    window2.RTCPeerConnection.prototype.getLocalStreams = function getLocalStreams() {
      if (!this._localStreams) {
        this._localStreams = [];
      }
      return this._localStreams;
    };
  }
  if (!("addStream" in window2.RTCPeerConnection.prototype)) {
    const _addTrack = window2.RTCPeerConnection.prototype.addTrack;
    window2.RTCPeerConnection.prototype.addStream = function addStream(stream) {
      if (!this._localStreams) {
        this._localStreams = [];
      }
      if (!this._localStreams.includes(stream)) {
        this._localStreams.push(stream);
      }
      stream.getAudioTracks().forEach((track) => _addTrack.call(this, track, stream));
      stream.getVideoTracks().forEach((track) => _addTrack.call(this, track, stream));
    };
    window2.RTCPeerConnection.prototype.addTrack = function addTrack(track, ...streams) {
      if (streams) {
        streams.forEach((stream) => {
          if (!this._localStreams) {
            this._localStreams = [stream];
          } else if (!this._localStreams.includes(stream)) {
            this._localStreams.push(stream);
          }
        });
      }
      return _addTrack.apply(this, arguments);
    };
  }
  if (!("removeStream" in window2.RTCPeerConnection.prototype)) {
    window2.RTCPeerConnection.prototype.removeStream = function removeStream(stream) {
      if (!this._localStreams) {
        this._localStreams = [];
      }
      const index = this._localStreams.indexOf(stream);
      if (index === -1) {
        return;
      }
      this._localStreams.splice(index, 1);
      const tracks = stream.getTracks();
      this.getSenders().forEach((sender) => {
        if (tracks.includes(sender.track)) {
          this.removeTrack(sender);
        }
      });
    };
  }
}
function shimRemoteStreamsAPI(window2) {
  if (typeof window2 !== "object" || !window2.RTCPeerConnection) {
    return;
  }
  if (!("getRemoteStreams" in window2.RTCPeerConnection.prototype)) {
    window2.RTCPeerConnection.prototype.getRemoteStreams = function getRemoteStreams() {
      return this._remoteStreams ? this._remoteStreams : [];
    };
  }
  if (!("onaddstream" in window2.RTCPeerConnection.prototype)) {
    Object.defineProperty(window2.RTCPeerConnection.prototype, "onaddstream", {
      get() {
        return this._onaddstream;
      },
      set(f) {
        if (this._onaddstream) {
          this.removeEventListener("addstream", this._onaddstream);
          this.removeEventListener("track", this._onaddstreampoly);
        }
        this.addEventListener("addstream", this._onaddstream = f);
        this.addEventListener("track", this._onaddstreampoly = (e) => {
          e.streams.forEach((stream) => {
            if (!this._remoteStreams) {
              this._remoteStreams = [];
            }
            if (this._remoteStreams.includes(stream)) {
              return;
            }
            this._remoteStreams.push(stream);
            const event = new Event("addstream");
            event.stream = stream;
            this.dispatchEvent(event);
          });
        });
      }
    });
    const origSetRemoteDescription = window2.RTCPeerConnection.prototype.setRemoteDescription;
    window2.RTCPeerConnection.prototype.setRemoteDescription = function setRemoteDescription() {
      const pc = this;
      if (!this._onaddstreampoly) {
        this.addEventListener("track", this._onaddstreampoly = function(e) {
          e.streams.forEach((stream) => {
            if (!pc._remoteStreams) {
              pc._remoteStreams = [];
            }
            if (pc._remoteStreams.indexOf(stream) >= 0) {
              return;
            }
            pc._remoteStreams.push(stream);
            const event = new Event("addstream");
            event.stream = stream;
            pc.dispatchEvent(event);
          });
        });
      }
      return origSetRemoteDescription.apply(pc, arguments);
    };
  }
}
function shimCallbacksAPI(window2) {
  if (typeof window2 !== "object" || !window2.RTCPeerConnection) {
    return;
  }
  const prototype = window2.RTCPeerConnection.prototype;
  const origCreateOffer = prototype.createOffer;
  const origCreateAnswer = prototype.createAnswer;
  const setLocalDescription = prototype.setLocalDescription;
  const setRemoteDescription = prototype.setRemoteDescription;
  const addIceCandidate = prototype.addIceCandidate;
  prototype.createOffer = function createOffer(successCallback, failureCallback) {
    const options = arguments.length >= 2 ? arguments[2] : arguments[0];
    const promise = origCreateOffer.apply(this, [options]);
    if (!failureCallback) {
      return promise;
    }
    promise.then(successCallback, failureCallback);
    return Promise.resolve();
  };
  prototype.createAnswer = function createAnswer(successCallback, failureCallback) {
    const options = arguments.length >= 2 ? arguments[2] : arguments[0];
    const promise = origCreateAnswer.apply(this, [options]);
    if (!failureCallback) {
      return promise;
    }
    promise.then(successCallback, failureCallback);
    return Promise.resolve();
  };
  let withCallback = function(description, successCallback, failureCallback) {
    const promise = setLocalDescription.apply(this, [description]);
    if (!failureCallback) {
      return promise;
    }
    promise.then(successCallback, failureCallback);
    return Promise.resolve();
  };
  prototype.setLocalDescription = withCallback;
  withCallback = function(description, successCallback, failureCallback) {
    const promise = setRemoteDescription.apply(this, [description]);
    if (!failureCallback) {
      return promise;
    }
    promise.then(successCallback, failureCallback);
    return Promise.resolve();
  };
  prototype.setRemoteDescription = withCallback;
  withCallback = function(candidate, successCallback, failureCallback) {
    const promise = addIceCandidate.apply(this, [candidate]);
    if (!failureCallback) {
      return promise;
    }
    promise.then(successCallback, failureCallback);
    return Promise.resolve();
  };
  prototype.addIceCandidate = withCallback;
}
function shimGetUserMedia4(window2) {
  const navigator2 = window2 && window2.navigator;
  if (navigator2.mediaDevices && navigator2.mediaDevices.getUserMedia) {
    const mediaDevices = navigator2.mediaDevices;
    const _getUserMedia = mediaDevices.getUserMedia.bind(mediaDevices);
    navigator2.mediaDevices.getUserMedia = (constraints) => {
      return _getUserMedia(shimConstraints(constraints));
    };
  }
  if (!navigator2.getUserMedia && navigator2.mediaDevices && navigator2.mediaDevices.getUserMedia) {
    navigator2.getUserMedia = function getUserMedia(constraints, cb, errcb) {
      navigator2.mediaDevices.getUserMedia(constraints).then(cb, errcb);
    }.bind(navigator2);
  }
}
function shimConstraints(constraints) {
  if (constraints && constraints.video !== undefined) {
    return Object.assign({}, constraints, { video: compactObject(constraints.video) });
  }
  return constraints;
}
function shimRTCIceServerUrls(window2) {
  const OrigPeerConnection = window2.RTCPeerConnection;
  window2.RTCPeerConnection = function RTCPeerConnection(pcConfig, pcConstraints) {
    if (pcConfig && pcConfig.iceServers) {
      const newIceServers = [];
      for (let i = 0;i < pcConfig.iceServers.length; i++) {
        let server = pcConfig.iceServers[i];
        if (!server.hasOwnProperty("urls") && server.hasOwnProperty("url")) {
          deprecated("RTCIceServer.url", "RTCIceServer.urls");
          server = JSON.parse(JSON.stringify(server));
          server.urls = server.url;
          delete server.url;
          newIceServers.push(server);
        } else {
          newIceServers.push(pcConfig.iceServers[i]);
        }
      }
      pcConfig.iceServers = newIceServers;
    }
    return new OrigPeerConnection(pcConfig, pcConstraints);
  };
  window2.RTCPeerConnection.prototype = OrigPeerConnection.prototype;
  if ("generateCertificate" in window2.RTCPeerConnection) {
    Object.defineProperty(window2.RTCPeerConnection, "generateCertificate", {
      get() {
        return OrigPeerConnection.generateCertificate;
      }
    });
  }
}
function shimTrackEventTransceiver(window2) {
  if (typeof window2 === "object" && window2.RTCTrackEvent && "receiver" in window2.RTCTrackEvent.prototype && !("transceiver" in window2.RTCTrackEvent.prototype)) {
    Object.defineProperty(window2.RTCTrackEvent.prototype, "transceiver", {
      get() {
        return { receiver: this.receiver };
      }
    });
  }
}
function shimCreateOfferLegacy(window2) {
  const origCreateOffer = window2.RTCPeerConnection.prototype.createOffer;
  window2.RTCPeerConnection.prototype.createOffer = function createOffer(offerOptions) {
    if (offerOptions) {
      if (typeof offerOptions.offerToReceiveAudio !== "undefined") {
        offerOptions.offerToReceiveAudio = !!offerOptions.offerToReceiveAudio;
      }
      const audioTransceiver = this.getTransceivers().find((transceiver) => transceiver.receiver.track.kind === "audio");
      if (offerOptions.offerToReceiveAudio === false && audioTransceiver) {
        if (audioTransceiver.direction === "sendrecv") {
          if (audioTransceiver.setDirection) {
            audioTransceiver.setDirection("sendonly");
          } else {
            audioTransceiver.direction = "sendonly";
          }
        } else if (audioTransceiver.direction === "recvonly") {
          if (audioTransceiver.setDirection) {
            audioTransceiver.setDirection("inactive");
          } else {
            audioTransceiver.direction = "inactive";
          }
        }
      } else if (offerOptions.offerToReceiveAudio === true && !audioTransceiver) {
        this.addTransceiver("audio");
      }
      if (typeof offerOptions.offerToReceiveVideo !== "undefined") {
        offerOptions.offerToReceiveVideo = !!offerOptions.offerToReceiveVideo;
      }
      const videoTransceiver = this.getTransceivers().find((transceiver) => transceiver.receiver.track.kind === "video");
      if (offerOptions.offerToReceiveVideo === false && videoTransceiver) {
        if (videoTransceiver.direction === "sendrecv") {
          if (videoTransceiver.setDirection) {
            videoTransceiver.setDirection("sendonly");
          } else {
            videoTransceiver.direction = "sendonly";
          }
        } else if (videoTransceiver.direction === "recvonly") {
          if (videoTransceiver.setDirection) {
            videoTransceiver.setDirection("inactive");
          } else {
            videoTransceiver.direction = "inactive";
          }
        }
      } else if (offerOptions.offerToReceiveVideo === true && !videoTransceiver) {
        this.addTransceiver("video");
      }
    }
    return origCreateOffer.apply(this, arguments);
  };
}

// node_modules/webrtc-adapter/src/js/common_shim.js
var exports_common_shim = {};
__export(exports_common_shim, {
  shimSendThrowTypeError: () => shimSendThrowTypeError,
  shimRTCIceCandidate: () => shimRTCIceCandidate,
  shimMaxMessageSize: () => shimMaxMessageSize,
  shimConnectionState: () => shimConnectionState,
  removeAllowExtmapMixed: () => removeAllowExtmapMixed
});
var import_sdp = __toESM(require_sdp(), 1);
function shimRTCIceCandidate(window2) {
  if (!window2.RTCIceCandidate || window2.RTCIceCandidate && "foundation" in window2.RTCIceCandidate.prototype) {
    return;
  }
  const NativeRTCIceCandidate = window2.RTCIceCandidate;
  window2.RTCIceCandidate = function RTCIceCandidate(args) {
    if (typeof args === "object" && args.candidate && args.candidate.indexOf("a=") === 0) {
      args = JSON.parse(JSON.stringify(args));
      args.candidate = args.candidate.substr(2);
    }
    if (args.candidate && args.candidate.length) {
      const nativeCandidate = new NativeRTCIceCandidate(args);
      const parsedCandidate = import_sdp.default.parseCandidate(args.candidate);
      const augmentedCandidate = Object.assign(nativeCandidate, parsedCandidate);
      augmentedCandidate.toJSON = function toJSON() {
        return {
          candidate: augmentedCandidate.candidate,
          sdpMid: augmentedCandidate.sdpMid,
          sdpMLineIndex: augmentedCandidate.sdpMLineIndex,
          usernameFragment: augmentedCandidate.usernameFragment
        };
      };
      return augmentedCandidate;
    }
    return new NativeRTCIceCandidate(args);
  };
  window2.RTCIceCandidate.prototype = NativeRTCIceCandidate.prototype;
  wrapPeerConnectionEvent(window2, "icecandidate", (e) => {
    if (e.candidate) {
      Object.defineProperty(e, "candidate", {
        value: new window2.RTCIceCandidate(e.candidate),
        writable: "false"
      });
    }
    return e;
  });
}
function shimMaxMessageSize(window2) {
  if (!window2.RTCPeerConnection) {
    return;
  }
  const browserDetails = detectBrowser(window2);
  if (!("sctp" in window2.RTCPeerConnection.prototype)) {
    Object.defineProperty(window2.RTCPeerConnection.prototype, "sctp", {
      get() {
        return typeof this._sctp === "undefined" ? null : this._sctp;
      }
    });
  }
  const sctpInDescription = function(description) {
    if (!description || !description.sdp) {
      return false;
    }
    const sections = import_sdp.default.splitSections(description.sdp);
    sections.shift();
    return sections.some((mediaSection) => {
      const mLine = import_sdp.default.parseMLine(mediaSection);
      return mLine && mLine.kind === "application" && mLine.protocol.indexOf("SCTP") !== -1;
    });
  };
  const getRemoteFirefoxVersion = function(description) {
    const match = description.sdp.match(/mozilla...THIS_IS_SDPARTA-(\d+)/);
    if (match === null || match.length < 2) {
      return -1;
    }
    const version = parseInt(match[1], 10);
    return version !== version ? -1 : version;
  };
  const getCanSendMaxMessageSize = function(remoteIsFirefox) {
    let canSendMaxMessageSize = 65536;
    if (browserDetails.browser === "firefox") {
      if (browserDetails.version < 57) {
        if (remoteIsFirefox === -1) {
          canSendMaxMessageSize = 16384;
        } else {
          canSendMaxMessageSize = 2147483637;
        }
      } else if (browserDetails.version < 60) {
        canSendMaxMessageSize = browserDetails.version === 57 ? 65535 : 65536;
      } else {
        canSendMaxMessageSize = 2147483637;
      }
    }
    return canSendMaxMessageSize;
  };
  const getMaxMessageSize = function(description, remoteIsFirefox) {
    let maxMessageSize = 65536;
    if (browserDetails.browser === "firefox" && browserDetails.version === 57) {
      maxMessageSize = 65535;
    }
    const match = import_sdp.default.matchPrefix(description.sdp, "a=max-message-size:");
    if (match.length > 0) {
      maxMessageSize = parseInt(match[0].substr(19), 10);
    } else if (browserDetails.browser === "firefox" && remoteIsFirefox !== -1) {
      maxMessageSize = 2147483637;
    }
    return maxMessageSize;
  };
  const origSetRemoteDescription = window2.RTCPeerConnection.prototype.setRemoteDescription;
  window2.RTCPeerConnection.prototype.setRemoteDescription = function setRemoteDescription() {
    this._sctp = null;
    if (browserDetails.browser === "chrome" && browserDetails.version >= 76) {
      const { sdpSemantics } = this.getConfiguration();
      if (sdpSemantics === "plan-b") {
        Object.defineProperty(this, "sctp", {
          get() {
            return typeof this._sctp === "undefined" ? null : this._sctp;
          },
          enumerable: true,
          configurable: true
        });
      }
    }
    if (sctpInDescription(arguments[0])) {
      const isFirefox = getRemoteFirefoxVersion(arguments[0]);
      const canSendMMS = getCanSendMaxMessageSize(isFirefox);
      const remoteMMS = getMaxMessageSize(arguments[0], isFirefox);
      let maxMessageSize;
      if (canSendMMS === 0 && remoteMMS === 0) {
        maxMessageSize = Number.POSITIVE_INFINITY;
      } else if (canSendMMS === 0 || remoteMMS === 0) {
        maxMessageSize = Math.max(canSendMMS, remoteMMS);
      } else {
        maxMessageSize = Math.min(canSendMMS, remoteMMS);
      }
      const sctp = {};
      Object.defineProperty(sctp, "maxMessageSize", {
        get() {
          return maxMessageSize;
        }
      });
      this._sctp = sctp;
    }
    return origSetRemoteDescription.apply(this, arguments);
  };
}
function shimSendThrowTypeError(window2) {
  if (!(window2.RTCPeerConnection && ("createDataChannel" in window2.RTCPeerConnection.prototype))) {
    return;
  }
  function wrapDcSend(dc, pc) {
    const origDataChannelSend = dc.send;
    dc.send = function send() {
      const data = arguments[0];
      const length = data.length || data.size || data.byteLength;
      if (dc.readyState === "open" && pc.sctp && length > pc.sctp.maxMessageSize) {
        throw new TypeError("Message too large (can send a maximum of " + pc.sctp.maxMessageSize + " bytes)");
      }
      return origDataChannelSend.apply(dc, arguments);
    };
  }
  const origCreateDataChannel = window2.RTCPeerConnection.prototype.createDataChannel;
  window2.RTCPeerConnection.prototype.createDataChannel = function createDataChannel() {
    const dataChannel = origCreateDataChannel.apply(this, arguments);
    wrapDcSend(dataChannel, this);
    return dataChannel;
  };
  wrapPeerConnectionEvent(window2, "datachannel", (e) => {
    wrapDcSend(e.channel, e.target);
    return e;
  });
}
function shimConnectionState(window2) {
  if (!window2.RTCPeerConnection || "connectionState" in window2.RTCPeerConnection.prototype) {
    return;
  }
  const proto = window2.RTCPeerConnection.prototype;
  Object.defineProperty(proto, "connectionState", {
    get() {
      return {
        completed: "connected",
        checking: "connecting"
      }[this.iceConnectionState] || this.iceConnectionState;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(proto, "onconnectionstatechange", {
    get() {
      return this._onconnectionstatechange || null;
    },
    set(cb) {
      if (this._onconnectionstatechange) {
        this.removeEventListener("connectionstatechange", this._onconnectionstatechange);
        delete this._onconnectionstatechange;
      }
      if (cb) {
        this.addEventListener("connectionstatechange", this._onconnectionstatechange = cb);
      }
    },
    enumerable: true,
    configurable: true
  });
  ["setLocalDescription", "setRemoteDescription"].forEach((method) => {
    const origMethod = proto[method];
    proto[method] = function() {
      if (!this._connectionstatechangepoly) {
        this._connectionstatechangepoly = (e) => {
          const pc = e.target;
          if (pc._lastConnectionState !== pc.connectionState) {
            pc._lastConnectionState = pc.connectionState;
            const newEvent = new Event("connectionstatechange", e);
            pc.dispatchEvent(newEvent);
          }
          return e;
        };
        this.addEventListener("iceconnectionstatechange", this._connectionstatechangepoly);
      }
      return origMethod.apply(this, arguments);
    };
  });
}
function removeAllowExtmapMixed(window2) {
  if (!window2.RTCPeerConnection) {
    return;
  }
  const browserDetails = detectBrowser(window2);
  if (browserDetails.browser === "chrome" && browserDetails.version >= 71) {
    return;
  }
  const nativeSRD = window2.RTCPeerConnection.prototype.setRemoteDescription;
  window2.RTCPeerConnection.prototype.setRemoteDescription = function setRemoteDescription(desc) {
    if (desc && desc.sdp && desc.sdp.indexOf("\na=extmap-allow-mixed") !== -1) {
      desc.sdp = desc.sdp.split("\n").filter((line) => {
        return line.trim() !== "a=extmap-allow-mixed";
      }).join("\n");
    }
    return nativeSRD.apply(this, arguments);
  };
}

// node_modules/webrtc-adapter/src/js/adapter_factory.js
function adapterFactory({ window: window2 } = {}, options = {
  shimChrome: true,
  shimFirefox: true,
  shimEdge: true,
  shimSafari: true
}) {
  const logging2 = log;
  const browserDetails = detectBrowser(window2);
  const adapter = {
    browserDetails,
    commonShim: exports_common_shim,
    extractVersion,
    disableLog,
    disableWarnings
  };
  switch (browserDetails.browser) {
    case "chrome":
      if (!exports_chrome_shim || !shimPeerConnection || !options.shimChrome) {
        logging2("Chrome shim is not included in this adapter release.");
        return adapter;
      }
      logging2("adapter.js shimming chrome.");
      adapter.browserShim = exports_chrome_shim;
      shimGetUserMedia(window2);
      shimMediaStream(window2);
      shimPeerConnection(window2);
      shimOnTrack(window2);
      shimAddTrackRemoveTrack(window2);
      shimGetSendersWithDtmf(window2);
      shimGetStats(window2);
      shimSenderReceiverGetStats(window2);
      fixNegotiationNeeded(window2);
      shimRTCIceCandidate(window2);
      shimConnectionState(window2);
      shimMaxMessageSize(window2);
      shimSendThrowTypeError(window2);
      removeAllowExtmapMixed(window2);
      break;
    case "firefox":
      if (!exports_firefox_shim || !shimPeerConnection3 || !options.shimFirefox) {
        logging2("Firefox shim is not included in this adapter release.");
        return adapter;
      }
      logging2("adapter.js shimming firefox.");
      adapter.browserShim = exports_firefox_shim;
      shimGetUserMedia3(window2);
      shimPeerConnection3(window2);
      shimOnTrack2(window2);
      shimRemoveStream(window2);
      shimSenderGetStats(window2);
      shimReceiverGetStats(window2);
      shimRTCDataChannel(window2);
      shimAddTransceiver(window2);
      shimCreateOffer(window2);
      shimCreateAnswer(window2);
      shimRTCIceCandidate(window2);
      shimConnectionState(window2);
      shimMaxMessageSize(window2);
      shimSendThrowTypeError(window2);
      break;
    case "edge":
      if (!exports_edge_shim || !shimPeerConnection2 || !options.shimEdge) {
        logging2("MS edge shim is not included in this adapter release.");
        return adapter;
      }
      logging2("adapter.js shimming edge.");
      adapter.browserShim = exports_edge_shim;
      shimGetUserMedia2(window2);
      shimGetDisplayMedia2(window2);
      shimPeerConnection2(window2);
      shimReplaceTrack(window2);
      shimMaxMessageSize(window2);
      shimSendThrowTypeError(window2);
      break;
    case "safari":
      if (!exports_safari_shim || !options.shimSafari) {
        logging2("Safari shim is not included in this adapter release.");
        return adapter;
      }
      logging2("adapter.js shimming safari.");
      adapter.browserShim = exports_safari_shim;
      shimRTCIceServerUrls(window2);
      shimCreateOfferLegacy(window2);
      shimCallbacksAPI(window2);
      shimLocalStreamsAPI(window2);
      shimRemoteStreamsAPI(window2);
      shimTrackEventTransceiver(window2);
      shimGetUserMedia4(window2);
      shimRTCIceCandidate(window2);
      shimMaxMessageSize(window2);
      shimSendThrowTypeError(window2);
      removeAllowExtmapMixed(window2);
      break;
    default:
      logging2("Unsupported browser!");
      break;
  }
  return adapter;
}

// node_modules/webrtc-adapter/src/js/adapter_core.js
var adapter = adapterFactory({ window });

// src/lib/srs.sdk.js
var SrsError = function(name, message) {
  this.name = name;
  this.message = message;
  this.stack = new Error().stack;
};
function SrsRtcWhipWhepAsync() {
  var self = {};
  self.constraints = {
    audio: true,
    video: {
      width: { ideal: 320, max: 576 }
    }
  };
  self.publish = async function(url, options) {
    if (url.indexOf("/whip/") === -1)
      throw new Error(`invalid WHIP url ${url}`);
    if (options?.videoOnly && options?.audioOnly)
      throw new Error(`The videoOnly and audioOnly in options can't be true at the same time`);
    if (!options?.videoOnly) {
      self.pc.addTransceiver("audio", { direction: "sendonly" });
    } else {
      self.constraints.audio = false;
    }
    if (!options?.audioOnly) {
      self.pc.addTransceiver("video", { direction: "sendonly" });
    } else {
      self.constraints.video = false;
    }
    if (!navigator.mediaDevices && window.location.protocol === "http:" && window.location.hostname !== "localhost") {
      throw new SrsError("HttpsRequiredError", `Please use HTTPS or localhost to publish, read https://github.com/ossrs/srs/issues/2762#issuecomment-983147576`);
    }
    var stream = await navigator.mediaDevices.getUserMedia(self.constraints);
    stream.getTracks().forEach(function(track) {
      self.pc.addTrack(track);
      self.ontrack && self.ontrack({ track });
    });
    var offer = await self.pc.createOffer();
    await self.pc.setLocalDescription(offer);
    const answer = await new Promise(function(resolve, reject) {
      console.log(`Generated offer: ${offer.sdp}`);
      const xhr = new XMLHttpRequest;
      xhr.onload = function() {
        if (xhr.readyState !== xhr.DONE)
          return;
        if (xhr.status !== 200 && xhr.status !== 201)
          return reject(xhr);
        const data = xhr.responseText;
        console.log("Got answer: ", data);
        return data.code ? reject(xhr) : resolve(data);
      };
      xhr.open("POST", url, true);
      xhr.setRequestHeader("Content-type", "application/sdp");
      xhr.send(offer.sdp);
    });
    await self.pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: answer }));
    return self.__internal.parseId(url, offer.sdp, answer);
  };
  self.play = async function(url, options) {
    if (url.indexOf("/whip-play/") === -1 && url.indexOf("/whep/") === -1)
      throw new Error(`invalid WHEP url ${url}`);
    if (options?.videoOnly && options?.audioOnly)
      throw new Error(`The videoOnly and audioOnly in options can't be true at the same time`);
    if (!options?.videoOnly)
      self.pc.addTransceiver("audio", { direction: "recvonly" });
    if (!options?.audioOnly)
      self.pc.addTransceiver("video", { direction: "recvonly" });
    var offer = await self.pc.createOffer();
    await self.pc.setLocalDescription(offer);
    const answer = await new Promise(function(resolve, reject) {
      console.log(`Generated offer: ${offer.sdp}`);
      const xhr = new XMLHttpRequest;
      xhr.onload = function() {
        if (xhr.readyState !== xhr.DONE)
          return;
        if (xhr.status !== 200 && xhr.status !== 201)
          return reject(xhr);
        const data = xhr.responseText;
        console.log("Got answer: ", data);
        return data.code ? reject(xhr) : resolve(data);
      };
      xhr.open("POST", url, true);
      xhr.setRequestHeader("Content-type", "application/sdp");
      xhr.send(offer.sdp);
    });
    await self.pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: answer }));
    return self.__internal.parseId(url, offer.sdp, answer);
  };
  self.close = function() {
    self.pc && self.pc.close();
  };
  self.ontrack = function(event) {
    self.stream.addTrack(event.track);
  };
  self.pc = new RTCPeerConnection(null);
  self.pc.addEventListener("iceconnectionstatechange", (e) => {
    console.log(`ICE connection state changed to ${e.target.iceConnectionState}`);
  });
  self.stream = new MediaStream;
  self.__internal = {
    parseId: (url, offer, answer) => {
      let sessionid = offer.substr(offer.indexOf("a=ice-ufrag:") + "a=ice-ufrag:".length);
      sessionid = sessionid.substr(0, sessionid.indexOf("\n") - 1) + ":";
      sessionid += answer.substr(answer.indexOf("a=ice-ufrag:") + "a=ice-ufrag:".length);
      sessionid = sessionid.substr(0, sessionid.indexOf("\n"));
      const a = document.createElement("a");
      a.href = url;
      return {
        sessionid,
        simulator: a.protocol + "//" + a.host + "/rtc/v1/nack/"
      };
    }
  };
  self.pc.ontrack = function(event) {
    if (self.ontrack) {
      self.ontrack(event);
    }
  };
  return self;
}
SrsError.prototype = Object.create(Error.prototype);
SrsError.prototype.constructor = SrsError;

// src/lib/winlin.utility.js
var AsyncRefresh = function(pfn, refresh_interval) {
  this.refresh_interval = refresh_interval;
  this.__handler = null;
  this.__pfn = pfn;
  this.__enabled = true;
};
var AsyncRefresh2 = function() {
  this.on_before_call_pfn = null;
  this.__call = {
    pfn: null,
    timeout: 0,
    __enabled: false,
    __handler: null
  };
};
AsyncRefresh.prototype.refresh_disable = function() {
  this.__enabled = false;
};
AsyncRefresh.prototype.refresh_enable = function() {
  this.__enabled = true;
};
AsyncRefresh.prototype.refresh_is_enabled = function() {
  return this.__enabled;
};
AsyncRefresh.prototype.request = function(timeout) {
  if (this.__handler) {
    clearTimeout(this.__handler);
  }
  this.__handler = setTimeout(this.__pfn, timeout);
};
var async_refresh2 = new AsyncRefresh2;
AsyncRefresh2.prototype.initialize = function(pfn, timeout) {
  this.refresh_change(pfn, timeout);
};
AsyncRefresh2.prototype.stop = function() {
  this.__call.__enabled = false;
};
AsyncRefresh2.prototype.restart = function() {
  this.__call.__enabled = true;
  this.request(0);
};
AsyncRefresh2.prototype.refresh_change = function(pfn, timeout) {
  if (this.__call.__handler) {
    clearTimeout(this.__handler);
  }
  this.__call.__enabled = false;
  this.__call = {
    pfn,
    timeout,
    __enabled: true,
    __handler: null
  };
};
AsyncRefresh2.prototype.request = function(timeout) {
  var self = this;
  var this_call = this.__call;
  if (this_call.__handler) {
    clearTimeout(this_call.__handler);
  }
  if (timeout == undefined) {
    timeout = this_call.timeout;
  }
  if (this_call.pfn == null || timeout == null) {
    return;
  }
  this_call.__handler = setTimeout(function() {
    if (!this_call.__enabled) {
      return;
    }
    if (self.on_before_call_pfn) {
      if (!self.on_before_call_pfn()) {
        return;
      }
    }
    this_call.pfn();
  }, timeout);
};

// src/app.js
var STREAM_URL = "http://192.168.100.2:2022/rtc/v1/whep/?app=live&stream=livestream";
var sdk = null;
var initStream = async () => {
  if (sdk) {
    sdk.close();
  }
  sdk = SrsRtcWhipWhepAsync();
  sdk.pc.addEventListener("iceconnectionstatechange", (e) => {
    if (sdk.pc.iceConnectionState === "failed") {
      setTimeout(async () => {
        await initStream();
      }, 2000);
    }
  });
  document.getElementById("rtc_media_player").srcObject = sdk.stream;
  const session = await sdk.play(STREAM_URL);
  console.log(`SRS session established [${session.sessionid}]`);
};
window.addEventListener("online", async () => {
  console.log("Browser back online");
  const retryPolicy = retry(handleAll, {
    maxAttempts: 30,
    backoff: new ExponentialBackoff({
      initialDelay: 500,
      maxDelay: 120000
    })
  });
  retryPolicy.onRetry(console.error);
  await retryPolicy.execute(async () => {
    if (!sdk || sdk.pc.iceConnectionState !== "connected") {
      console.log("Reconnecting to stream");
      await initStream();
    }
  });
});
window.addEventListener("load", async () => {
  await initStream();
});
