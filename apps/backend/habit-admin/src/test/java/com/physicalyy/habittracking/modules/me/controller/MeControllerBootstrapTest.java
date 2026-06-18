package com.physicalyy.habittracking.modules.me.controller;

import com.physicalyy.habittracking.HabitTrackingApplication;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(classes = HabitTrackingApplication.class)
@AutoConfigureMockMvc
class MeControllerBootstrapTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Value("${AVATAR_STORAGE_DIR:${avatar.storage-dir:./data/avatars}}")
    private String avatarStorageDir;

    private String openid;

    @BeforeEach
    void setUp() {
        openid = "openid-" + System.nanoTime();
    }

    @Test
    void bootstrap_without_auth_returns_unauthorized() throws Exception {
        mockMvc.perform(get("/api/me/bootstrap"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void bootstrap_with_new_openid_returns_onboarding_required() throws Exception {
        mockMvc.perform(get("/api/me/bootstrap")
                        .header("X-Test-Openid", openid)
                        .header("X-Test-Nickname", "妈妈"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.needOnboarding").value(true))
                .andExpect(jsonPath("$.data.currentUser.openid").value(openid))
                .andExpect(jsonPath("$.data.currentUser.nickname").value("妈妈"))
                .andExpect(jsonPath("$.data.currentUser.avatarUrl").doesNotExist())
                .andExpect(jsonPath("$.data.currentUser.profileCompleted").value(true))
                .andExpect(jsonPath("$.data.families").isArray())
                .andExpect(jsonPath("$.data.defaultFamily").doesNotExist())
                .andExpect(jsonPath("$.data.defaultChild").doesNotExist());
    }

    @Test
    void bootstrap_after_creating_family_returns_default_family_and_child() throws Exception {
        mockMvc.perform(post("/api/families")
                        .header("X-Test-Openid", openid)
                        .header("X-Test-Nickname", "爸爸")
                        .contentType("application/json")
                        .content("""
                                {
                                  "name": "小宝的家庭",
                                  "childNickname": "小宝"
                                }
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/me/bootstrap")
                        .header("X-Test-Openid", openid)
                        .header("X-Test-Nickname", "爸爸"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.needOnboarding").value(false))
                .andExpect(jsonPath("$.data.currentUser.id").isString())
                .andExpect(jsonPath("$.data.defaultFamily.id").isString())
                .andExpect(jsonPath("$.data.defaultFamily.name").value("小宝的家庭"))
                .andExpect(jsonPath("$.data.defaultFamily.admin").value(true))
                .andExpect(jsonPath("$.data.defaultChild.id").isString())
                .andExpect(jsonPath("$.data.defaultChild.familyId").isString())
                .andExpect(jsonPath("$.data.defaultChild.nickname").value("小宝"))
                .andExpect(jsonPath("$.data.families[0].name").value("小宝的家庭"))
                .andExpect(jsonPath("$.data.families[0].id").isString())
                .andExpect(jsonPath("$.data.families[0].admin").value(true));
    }

    @Test
    void avatar_upload_requires_auth() throws Exception {
        mockMvc.perform(multipart("/api/me/avatar")
                        .file(validPngFile()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void avatar_upload_accepts_valid_image_and_public_file_can_be_read() throws Exception {
        MvcResult result = mockMvc.perform(multipart("/api/me/avatar")
                        .file(validPngFile())
                        .header("X-Test-Openid", openid)
                        .header("X-Test-Nickname", "妈妈"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.avatarUrl").isString())
                .andExpect(jsonPath("$.data.avatarUrl").value(org.hamcrest.Matchers.startsWith("/api/public/avatars/")))
                .andReturn();

        String avatarUrl = result.getResponse().getContentAsString()
                .replaceAll("(?s).*\"avatarUrl\":\"([^\"]+)\".*", "$1");
        String filename = avatarUrl.substring("/api/public/avatars/".length());
        assertThat(Files.isRegularFile(Path.of(avatarStorageDir).toAbsolutePath().normalize().resolve(filename))).isTrue();

        mockMvc.perform(get(avatarUrl))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/me/bootstrap")
                        .header("X-Test-Openid", openid)
                        .header("X-Test-Nickname", "妈妈"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentUser.avatarUrl").value(avatarUrl))
                .andExpect(jsonPath("$.data.currentUser.profileCompleted").value(true));
    }

    @Test
    void avatar_upload_rejects_empty_and_disguised_file() throws Exception {
        mockMvc.perform(multipart("/api/me/avatar")
                        .file(new MockMultipartFile("file", "empty.png", "image/png", new byte[0]))
                        .header("X-Test-Openid", openid)
                        .header("X-Test-Nickname", "妈妈"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));

        mockMvc.perform(multipart("/api/me/avatar")
                        .file(new MockMultipartFile("file", "fake.png", "image/png", "not an image".getBytes()))
                        .header("X-Test-Openid", openid)
                        .header("X-Test-Nickname", "妈妈"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));
    }

    @Test
    void update_profile_updates_user_summary_and_active_family_members() throws Exception {
        mockMvc.perform(post("/api/families")
                        .header("X-Test-Openid", openid)
                        .header("X-Test-Nickname", "旧昵称")
                        .contentType("application/json")
                        .content("""
                                {
                                  "name": "资料家庭",
                                  "childNickname": "小资料"
                                }
                                """))
                .andExpect(status().isOk());

        MvcResult uploadResult = mockMvc.perform(multipart("/api/me/avatar")
                        .file(validPngFile())
                        .header("X-Test-Openid", openid)
                        .header("X-Test-Nickname", "旧昵称"))
                .andExpect(status().isOk())
                .andReturn();
        String avatarUrl = uploadResult.getResponse().getContentAsString()
                .replaceAll("(?s).*\"avatarUrl\":\"([^\"]+)\".*", "$1");

        mockMvc.perform(patch("/api/me/profile")
                        .header("X-Test-Openid", openid)
                        .header("X-Test-Nickname", "旧昵称")
                        .contentType("application/json")
                        .content("""
                                {
                                  "nickname": "新昵称",
                                  "avatarUrl": "%s"
                                }
                                """.formatted(avatarUrl)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.nickname").value("新昵称"))
                .andExpect(jsonPath("$.data.avatarUrl").value(avatarUrl))
                .andExpect(jsonPath("$.data.profileCompleted").value(true));

        mockMvc.perform(get("/api/me/bootstrap")
                        .header("X-Test-Openid", openid))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentUser.nickname").value("新昵称"))
                .andExpect(jsonPath("$.data.currentUser.avatarUrl").value(avatarUrl));

        mockMvc.perform(get("/api/families/{familyId}/members", familyIdByName("资料家庭"))
                        .header("X-Test-Openid", openid))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].displayName").value("新昵称"));
    }

    @Test
    void update_profile_rejects_avatar_url_from_other_user() throws Exception {
        String otherOpenid = "other-" + System.nanoTime();
        MvcResult uploadResult = mockMvc.perform(multipart("/api/me/avatar")
                        .file(validPngFile())
                        .header("X-Test-Openid", otherOpenid)
                        .header("X-Test-Nickname", "其他人"))
                .andExpect(status().isOk())
                .andReturn();
        String avatarUrl = uploadResult.getResponse().getContentAsString()
                .replaceAll("(?s).*\"avatarUrl\":\"([^\"]+)\".*", "$1");

        mockMvc.perform(patch("/api/me/profile")
                        .header("X-Test-Openid", openid)
                        .header("X-Test-Nickname", "妈妈")
                        .contentType("application/json")
                        .content("""
                                {
                                  "nickname": "妈妈",
                                  "avatarUrl": "%s"
                                }
                                """.formatted(avatarUrl)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));
    }

    private MockMultipartFile validPngFile() {
        byte[] pngBytes = new byte[] {
                (byte) 0x89, 0x50, 0x4e, 0x47,
                0x0d, 0x0a, 0x1a, 0x0a,
                0x00, 0x00, 0x00, 0x0d
        };
        return new MockMultipartFile("file", "avatar.png", "image/png", pngBytes);
    }

    private Long familyIdByName(String name) {
        return jdbcTemplate.queryForObject(
                "select id from family_group where name = ? and del_flag = '0'",
                Long.class,
                name
        );
    }
}
