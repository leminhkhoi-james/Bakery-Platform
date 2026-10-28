package com.se193262.bakeryservice.feature.member.controller;

import com.se193262.bakeryservice.feature.member.dto.BakeryMemberDto;
import com.se193262.bakeryservice.feature.member.service.BakeryMemberService;
import com.se193262.bakeryservice.shared.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/bakeries/{bakeryId}/members")
public class BakeryMemberController {

    private final BakeryMemberService memberService;

    public BakeryMemberController(BakeryMemberService memberService) {
        this.memberService = memberService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BakeryMemberDto>>> list(@PathVariable UUID bakeryId) {
        return ResponseEntity.ok(ApiResponse.success(memberService.list(bakeryId)));
    }

}
