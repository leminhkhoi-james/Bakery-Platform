package com.se193262.bakeryservice.feature.member.controller;

import com.se193262.bakeryservice.feature.member.dto.BakeryMemberDto;
import com.se193262.bakeryservice.feature.member.service.BakeryMemberService;
import com.se193262.bakeryservice.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;

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

    @PostMapping
    public ResponseEntity<ApiResponse<BakeryMemberDto>> create(@PathVariable UUID bakeryId,
            @Valid @RequestBody BakeryMemberDto request, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(memberService.createAs(bakeryId,
                        UUID.fromString(jwt.getSubject()), request)));
    }

    @PatchMapping("/{memberId}")
    public ResponseEntity<ApiResponse<BakeryMemberDto>> update(@PathVariable UUID bakeryId,
            @PathVariable UUID memberId, @Valid @RequestBody BakeryMemberDto request,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(ApiResponse.success(memberService.updateAs(bakeryId,
                UUID.fromString(jwt.getSubject()), memberId, request)));
    }

    @DeleteMapping("/{memberId}")
    public ResponseEntity<Void> delete(@PathVariable UUID bakeryId, @PathVariable UUID memberId,
            @AuthenticationPrincipal Jwt jwt) {
        memberService.deleteAs(bakeryId, UUID.fromString(jwt.getSubject()), memberId);
        return ResponseEntity.noContent().build();
    }
}
